"""File tools for reading and writing files in the workspace."""

import re
import shutil
from fnmatch import fnmatch
from pathlib import Path
from typing import NamedTuple

from agent.tool_result import ToolResult
from .utils import clean_file_content, is_binary_file, is_image_file, read_line_ranges

DEFAULT_PROTECTED_PATTERNS = [
    ".agentignore", ".agentprotected", ".agent/**",
    ".vscode/**", "*.code-workspace", ".env",
]


class WriteProtection:
    def __init__(self, workspace: Path, patterns: list[str] | None = None):
        self.workspace = workspace
        self.patterns = patterns if patterns is not None else DEFAULT_PROTECTED_PATTERNS.copy()
        protected_file = workspace / ".agentprotected"
        if protected_file.exists():
            try:
                for line in protected_file.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line and not line.startswith("#"):
                        self.patterns.append(line)
            except Exception:
                pass

    def is_protected(self, relative_path: str) -> bool:
        normalized = relative_path.replace("\\", "/")
        for pattern in self.patterns:
            if "**" in pattern:
                regex_pattern = pattern.replace("**", ".*").replace("*", "[^/]*")
                if re.match(f"^{regex_pattern}$", normalized):
                    return True
                if re.search(regex_pattern.replace("^", "").replace("$", ""), normalized):
                    return True
            elif fnmatch(normalized, pattern):
                return True
            elif "/" not in pattern and fnmatch(Path(normalized).name, pattern):
                return True
        return False


def create_file_tools(workspace_root: str | Path) -> dict:
    """Create file tool handlers. Returns dict of {name: {description, parameters, handler}}."""
    workspace = Path(workspace_root).resolve()
    protection = WriteProtection(workspace)

    def resolve_path(relative_path: str) -> Path:
        full_path = (workspace / relative_path).resolve()
        try:
            full_path.relative_to(workspace)
        except ValueError:
            raise ValueError(f"Path '{relative_path}' escapes workspace root")
        return full_path

    def check_write_protection(path_str: str) -> str | None:
        if protection.is_protected(path_str):
            return f"Cannot modify write-protected file: {path_str}"
        return None

    # --- read_file ---
    async def read_file_handler(files: list) -> str:
        if not files:
            return "Error: No files specified"
        results = []
        for file_entry in files:
            path_str = file_entry.get("path") if isinstance(file_entry, dict) else file_entry
            if not path_str:
                results.append("Error: Missing 'path'")
                continue
            try:
                full_path = resolve_path(path_str)
            except ValueError as e:
                results.append(f"Error: {e}")
                continue
            if not full_path.exists():
                results.append(f"Error: File not found: {path_str}")
                continue
            if not full_path.is_file():
                results.append(f"Error: Not a file: {path_str}")
                continue
            if is_binary_file(full_path):
                results.append(f"Binary file: {path_str}")
                continue
            try:
                ranges = file_entry.get("line_ranges") if isinstance(file_entry, dict) else None
                content = read_line_ranges(full_path, ranges)
                header = f"File: {path_str}"
                results.append(f"{header}\n{content}")
            except Exception as e:
                results.append(f"Error reading {path_str}: {e}")
        return "\n\n---\n\n".join(results)

    # --- write_file ---
    async def write_file_handler(path: str, content: str) -> str:
        error = check_write_protection(path)
        if error:
            return f"Error: {error}"
        try:
            full_path = resolve_path(path)
        except ValueError as e:
            return f"Error: {e}"
        cleaned = clean_file_content(content)
        full_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            full_path.write_text(cleaned, encoding="utf-8")
            return f"Wrote {len(cleaned.encode('utf-8'))} bytes to {path}"
        except Exception as e:
            return f"Error writing {path}: {e}"

    # --- edit_file ---
    async def edit_file_handler(file_path: str, old_string: str, new_string: str, expected_replacements: int = 1) -> str:
        error = check_write_protection(file_path)
        if error:
            return f"Error: {error}"
        try:
            full_path = resolve_path(file_path)
        except ValueError as e:
            return f"Error: {e}"

        if old_string == "":
            if full_path.exists():
                return f"Error: {file_path} already exists. Use non-empty old_string to edit."
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(new_string, encoding="utf-8")
            return f"Created new file: {file_path}"

        if not full_path.exists():
            return f"Error: File not found: {file_path}"
        content = full_path.read_text(encoding="utf-8").replace("\r\n", "\n")
        old_string = old_string.replace("\r\n", "\n")
        new_string = new_string.replace("\r\n", "\n")
        count = content.count(old_string)
        if count == 0:
            return f"Error: No match found in {file_path}. old_string must match EXACTLY."
        if count != expected_replacements:
            return f"Error: Found {count} occurrences, expected {expected_replacements}."
        new_content = content.replace(old_string, new_string, expected_replacements)
        full_path.write_text(new_content, encoding="utf-8")
        return f"Edited {file_path}: replaced {expected_replacements} occurrence(s)"

    # --- delete_file ---
    async def delete_file_handler(path: str) -> str:
        error = check_write_protection(path)
        if error:
            return f"Error: {error}"
        try:
            full_path = resolve_path(path)
        except ValueError as e:
            return f"Error: {e}"
        if not full_path.exists():
            return f"Error: Path not found: {path}"
        if full_path == workspace:
            return "Error: Cannot delete workspace root"
        if full_path.is_file():
            full_path.unlink()
            return f"Deleted file: {path}"
        elif full_path.is_dir():
            file_count = sum(1 for _ in full_path.rglob("*") if _.is_file())
            shutil.rmtree(full_path)
            return f"Deleted directory: {path} ({file_count} files)"
        return f"Error: Unknown path type: {path}"

    # --- apply_diff ---
    class SearchReplaceBlock(NamedTuple):
        start_line: int
        search_content: str
        replace_content: str

    def parse_blocks(diff_text: str) -> list[SearchReplaceBlock]:
        pattern = re.compile(
            r"<<<<<<< SEARCH>?\s*\n"
            r"(?::start_line:\s*(\d+)\s*\n)?"
            r"(?:-------\s*\n)?"
            r"([\s\S]*?)\n?"
            r"=======\s*\n"
            r"([\s\S]*?)\n?"
            r">>>>>>> REPLACE",
            re.MULTILINE,
        )
        blocks = []
        for m in pattern.finditer(diff_text):
            blocks.append(SearchReplaceBlock(
                int(m.group(1)) if m.group(1) else 0,
                m.group(2), m.group(3),
            ))
        return blocks

    async def apply_diff_handler(path: str, diff: str) -> str:
        error = check_write_protection(path)
        if error:
            return f"Error: {error}"
        try:
            full_path = resolve_path(path)
        except ValueError as e:
            return f"Error: {e}"
        blocks = parse_blocks(diff)
        if not blocks:
            return "Error: No SEARCH/REPLACE blocks found"
        if not full_path.exists():
            return f"Error: File not found: {path}"
        content = full_path.read_text(encoding="utf-8")
        lines = content.split("\n")
        applied = 0
        delta = 0
        for block in sorted(blocks, key=lambda b: b.start_line):
            search_lines = block.search_content.split("\n")
            replace_lines = block.replace_content.split("\n")
            search_text = "\n".join(search_lines)
            adj = block.start_line + delta if block.start_line > 0 else 0
            found = -1
            start = max(0, adj - 1 - 40) if adj > 0 else 0
            end = min(len(lines), (adj - 1 if adj > 0 else 0) + len(search_lines) + 40)
            for i in range(start, max(start, end - len(search_lines) + 1)):
                if "\n".join(lines[i:i + len(search_lines)]) == search_text:
                    found = i
                    break
            if found >= 0:
                lines = lines[:found] + replace_lines + lines[found + len(search_lines):]
                delta += len(replace_lines) - len(search_lines)
                applied += 1
        if applied == 0:
            return f"Error: No blocks could be applied to {path}"
        full_path.write_text("\n".join(lines), encoding="utf-8")
        return f"Applied {applied}/{len(blocks)} block(s) to {path}"

    return {
        "read_file": {
            "handler": read_file_handler,
            "description": "Read one or more files with optional line ranges. Use line ranges for large files.",
            "parameters": [
                {"name": "files", "type": "object[]", "description": "List of files to read, each with 'path' and optional 'line_ranges' [[start, end]]", "required": True},
            ],
        },
        "write_file": {
            "handler": write_file_handler,
            "description": "Write content to a file. Creates dirs if needed. Always provide COMPLETE file content.",
            "parameters": [
                {"name": "path", "type": "string", "description": "File path relative to workspace", "required": True},
                {"name": "content", "type": "string", "description": "Complete file content to write", "required": True},
            ],
        },
        "edit_file": {
            "handler": edit_file_handler,
            "description": "Replace text in an existing file or create a new one. old_string must match EXACTLY.",
            "parameters": [
                {"name": "file_path", "type": "string", "description": "Path to file", "required": True},
                {"name": "old_string", "type": "string", "description": "Exact text to find (empty to create new file)", "required": True},
                {"name": "new_string", "type": "string", "description": "Replacement text", "required": True},
                {"name": "expected_replacements", "type": "number", "description": "Expected replacement count (default: 1)", "required": False},
            ],
        },
        "delete_file": {
            "handler": delete_file_handler,
            "description": "Delete a file or directory. Cannot delete write-protected files.",
            "parameters": [
                {"name": "path", "type": "string", "description": "Path to file or directory to delete", "required": True},
            ],
        },
        "apply_diff": {
            "handler": apply_diff_handler,
            "description": "Apply SEARCH/REPLACE blocks to modify a file. SEARCH must match exactly.",
            "parameters": [
                {"name": "path", "type": "string", "description": "Path to file to modify", "required": True},
                {"name": "diff", "type": "string", "description": "SEARCH/REPLACE blocks", "required": True},
            ],
        },
    }
