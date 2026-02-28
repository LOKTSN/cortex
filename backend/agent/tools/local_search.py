"""Search tools for listing and searching files in the workspace."""

import fnmatch
import re
from pathlib import Path

SKIP_DIRS = {
    ".git", ".svn", ".hg", "node_modules", "__pycache__", ".pytest_cache",
    ".mypy_cache", ".tox", ".nox", ".eggs", "*.egg-info", ".venv", "venv",
    "env", ".env", "dist", "build", ".next", ".nuxt", "coverage", ".coverage",
}
MAX_LIST_ITEMS = 200
MAX_SEARCH_RESULTS = 300
MAX_LINE_LENGTH = 500


def _load_gitignore(workspace: Path) -> list[str]:
    gi = workspace / ".gitignore"
    if not gi.exists():
        return []
    patterns = []
    try:
        for line in gi.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                patterns.append(line)
    except (OSError, IOError):
        pass
    return patterns


def _should_skip(path: Path, workspace: Path, gi_patterns: list[str]) -> bool:
    name = path.name
    if path.is_dir() and name in SKIP_DIRS:
        return True
    rel = str(path.relative_to(workspace))
    for p in gi_patterns:
        if p.endswith("/"):
            if path.is_dir() and fnmatch.fnmatch(name, p[:-1]):
                return True
        elif p.startswith("!"):
            continue
        elif fnmatch.fnmatch(name, p) or fnmatch.fnmatch(rel, p):
            return True
    return False


def _list_dir(directory: Path, workspace: Path, recursive: bool, gi: list[str], results: list[str], max_items: int) -> bool:
    try:
        entries = sorted(directory.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
    except PermissionError:
        return False
    for entry in entries:
        if len(results) >= max_items:
            return True
        if _should_skip(entry, workspace, gi):
            continue
        rel = entry.relative_to(workspace)
        if entry.is_dir():
            results.append(f"{rel}/")
            if recursive and _list_dir(entry, workspace, recursive, gi, results, max_items):
                return True
        else:
            results.append(str(rel))
    return False


def create_search_tools(workspace_root: str | Path) -> dict:
    """Create search tool handlers."""
    workspace = Path(workspace_root).resolve()

    def resolve_path(p: str) -> Path:
        full = (workspace / p).resolve()
        try:
            full.relative_to(workspace)
        except ValueError:
            raise ValueError(f"Path '{p}' escapes workspace root")
        return full

    async def list_files_handler(path: str = ".", recursive: bool = False) -> str:
        try:
            target = resolve_path(path)
        except ValueError as e:
            return f"Error: {e}"
        if not target.exists():
            return f"Error: Directory not found: {path}"
        if not target.is_dir():
            return f"Error: Not a directory: {path}"
        gi = _load_gitignore(workspace)
        results: list[str] = []
        limit = _list_dir(target, workspace, recursive, gi, results, MAX_LIST_ITEMS)
        if not results:
            return f"Directory '{path}' is empty"
        output = "\n".join(results)
        if limit:
            output += f"\n\n... (limited to {MAX_LIST_ITEMS} items)"
        return output

    async def search_files_handler(path: str = ".", regex: str = "", file_pattern: str | None = None) -> str:
        if not regex:
            return "Error: Missing 'regex' parameter"
        try:
            target = resolve_path(path)
        except ValueError as e:
            return f"Error: {e}"
        if not target.is_dir():
            return f"Error: Not a directory: {path}"
        try:
            pattern = re.compile(regex)
        except re.error as e:
            return f"Error: Invalid regex: {e}"

        gi = _load_gitignore(workspace)
        files: list[Path] = []

        def collect(d: Path):
            try:
                for entry in d.iterdir():
                    if _should_skip(entry, workspace, gi):
                        continue
                    if entry.is_dir():
                        collect(entry)
                    elif entry.is_file():
                        if file_pattern:
                            patterns = []
                            if "{" in file_pattern and "}" in file_pattern:
                                base = file_pattern.split("{")[0]
                                exts = file_pattern.split("{")[1].split("}")[0].split(",")
                                patterns = [f"{base}{ext}" for ext in exts]
                            else:
                                patterns = [file_pattern]
                            if not any(fnmatch.fnmatch(entry.name, p) for p in patterns):
                                continue
                        files.append(entry)
            except PermissionError:
                pass

        collect(target)

        output_parts = []
        total = 0
        for fp in files:
            if total >= MAX_SEARCH_RESULTS:
                break
            try:
                lines = fp.read_text(encoding="utf-8", errors="replace").splitlines()
            except (OSError, IOError):
                continue
            matches = [(i, line) for i, line in enumerate(lines, 1) if pattern.search(line)]
            if not matches:
                continue
            rel = fp.relative_to(workspace)
            parts = []
            for num, line in matches:
                if total >= MAX_SEARCH_RESULTS:
                    break
                if len(line) > MAX_LINE_LENGTH:
                    line = line[:MAX_LINE_LENGTH] + " [truncated]"
                parts.append(f"  {num:>4} > {line}")
                total += 1
            output_parts.append(f"{rel}:\n" + "\n".join(parts))

        if not output_parts:
            return f"No matches found for '{regex}' in {path}"
        output = "\n\n".join(output_parts)
        if total >= MAX_SEARCH_RESULTS:
            output += f"\n\n... (limited to {MAX_SEARCH_RESULTS} matches)"
        return output

    return {
        "list_files": {
            "handler": list_files_handler,
            "description": "List files and directories. Directories have trailing '/'. Respects .gitignore.",
            "parameters": [
                {"name": "path", "type": "string", "description": "Directory path relative to workspace", "required": True},
                {"name": "recursive", "type": "boolean", "description": "List recursively (default: false)", "required": False},
            ],
        },
        "search_files": {
            "handler": search_files_handler,
            "description": "Search for regex patterns across files. Returns matching lines with line numbers.",
            "parameters": [
                {"name": "path", "type": "string", "description": "Directory to search in", "required": True},
                {"name": "regex", "type": "string", "description": "Regular expression pattern", "required": True},
                {"name": "file_pattern", "type": "string", "description": "Glob filter (e.g. '*.py')", "required": False},
            ],
        },
    }
