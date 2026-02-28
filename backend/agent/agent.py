"""Cortex Agent — simple tool-calling loop with MiniMax M2.5.

No LangGraph. Just OpenAI-compatible function calling in a loop.
"""

import json
import logging
import os
import re
from pathlib import Path

import httpx
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Cortex, an AI learning companion and coding assistant.

You help users discover, understand, and build things by:
1. **Searching** the web for relevant information (use exa_search)
2. **Reading** web pages for detailed content (use web_fetch)
3. **Synthesizing** information into clear, engaging explanations
4. **Generating images** — create illustrations, diagrams, or visuals (use generate_image). Always include the returned markdown image in your response so the user sees it.
5. **Building** — you can read/write/edit files and run commands in the workspace

When asked about a topic:
- Search for it first to get current information
- Read the most relevant results for details
- Synthesize a clear, well-structured answer
- Save important findings as notes if asked

Be concise but thorough. Use markdown formatting. Cite your sources with URLs.
"""

MAX_TOOL_ROUNDS = 10


def _build_tools_schema() -> list[dict]:
    """OpenAI function-calling tool schemas."""
    return [
        {
            "type": "function",
            "function": {
                "name": "exa_search",
                "description": "Search the web using Exa semantic search. Returns results with titles, URLs, and content highlights. Use this to find current information about any topic.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The search query"},
                        "max_results": {"type": "integer", "description": "Max results (default: 5)", "default": 5},
                    },
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "web_fetch",
                "description": "Fetch a web page and return its content as clean text. Use this to read the full content of a URL from search results.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "The URL to fetch"},
                    },
                    "required": ["url"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "generate_image",
                "description": "Generate an image using MiniMax image-01 model. Returns a markdown image tag. Use when the user asks to create, generate, draw, or visualize an image, diagram, illustration, or picture.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "prompt": {"type": "string", "description": "Detailed visual description in English"},
                        "aspect_ratio": {"type": "string", "description": "Aspect ratio (default: 16:9)", "default": "16:9"},
                    },
                    "required": ["prompt"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "read_file",
                "description": "Read a file from the workspace. Path is relative to workspace root.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "File path relative to workspace"},
                    },
                    "required": ["path"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "write_file",
                "description": "Write content to a file in the workspace. Creates directories if needed.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "File path relative to workspace"},
                        "content": {"type": "string", "description": "Complete file content to write"},
                    },
                    "required": ["path", "content"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "edit_file",
                "description": "Replace exact text in a file. old_string must match exactly.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {"type": "string", "description": "Path to file"},
                        "old_string": {"type": "string", "description": "Exact text to find"},
                        "new_string": {"type": "string", "description": "Replacement text"},
                    },
                    "required": ["file_path", "old_string", "new_string"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "list_files",
                "description": "List files and directories in the workspace.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Directory path (default: .)", "default": "."},
                        "recursive": {"type": "boolean", "description": "List recursively", "default": False},
                    },
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "search_files",
                "description": "Search for a regex pattern across files in the workspace.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Directory to search in"},
                        "regex": {"type": "string", "description": "Regex pattern to search for"},
                        "file_pattern": {"type": "string", "description": "Glob pattern for files (e.g. *.py)", "default": ""},
                    },
                    "required": ["path", "regex"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "execute_command",
                "description": "Execute a shell command in the workspace. Blocked: package installs, dangerous ops.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {"type": "string", "description": "The CLI command to execute"},
                        "cwd": {"type": "string", "description": "Working directory relative to workspace", "default": ""},
                    },
                    "required": ["command"],
                },
            },
        },
    ]


# ---------------------------------------------------------------------------
# Tool handlers (plain async functions, no framework dependency)
# ---------------------------------------------------------------------------

async def _exec_exa_search(query: str, max_results: int = 5) -> str:
    api_key = os.getenv("EXA_API_KEY")
    if not api_key:
        return "Error: EXA_API_KEY not set"
    try:
        from exa_py import Exa
        exa = Exa(api_key=api_key)
        results = exa.search_and_contents(
            query, num_results=min(max_results, 10), type="auto",
            text={"max_characters": 1000}, highlights=True,
        )
    except Exception as e:
        return f"Error: Exa search failed: {e}"
    if not results.results:
        return f"No results found for '{query}'"
    lines = [f"## Search Results for '{query}'", ""]
    for i, r in enumerate(results.results, 1):
        lines.append(f"### {i}. {r.title or 'No title'}")
        if r.url:
            lines.append(f"URL: {r.url}")
        if hasattr(r, "highlights") and r.highlights:
            for h in r.highlights[:2]:
                lines.append(f"> {h}")
        if hasattr(r, "text") and r.text:
            text = r.text[:500] + ("..." if len(r.text) > 500 else "")
            lines.append(text)
        lines.append("---")
    return "\n".join(lines)


async def _exec_web_fetch(url: str) -> str:
    if not url:
        return "Error: Missing URL"
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30,
                                     headers={"User-Agent": "Mozilla/5.0 (compatible; Cortex/1.0)"}) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as e:
        return f"Error fetching {url}: {e}"
    try:
        import trafilatura
        content = trafilatura.extract(html, include_links=True, include_tables=True, output_format="txt")
    except ImportError:
        content = re.sub(r"<[^>]+>", " ", html)
        content = re.sub(r"\s+", " ", content).strip()
    if not content or len(content.strip()) < 50:
        return f"Page returned empty or minimal content: {url}"
    if len(content) > 30000:
        content = content[:30000] + "\n\n... (truncated)"
    return content


async def _exec_generate_image(prompt: str, aspect_ratio: str = "16:9") -> str:
    api_key = os.getenv("MINIMAX_API_KEY")
    if not api_key:
        return "Error: MINIMAX_API_KEY not set"
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.minimax.io/v1/image_generation",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": "image-01", "prompt": prompt, "aspect_ratio": aspect_ratio,
                      "n": 1, "response_format": "url", "prompt_optimizer": True},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        return f"Error generating image: {e}"
    urls = data.get("data", {}).get("image_urls", [])
    if not urls:
        return f"Image generation failed: {data.get('base_resp', {}).get('status_msg', 'unknown')}"
    return f"![Generated image]({urls[0]})"


def _build_file_handlers(workspace: Path):
    """Build workspace-scoped file/exec handlers. Returns handler dict."""

    def _resolve(rel: str) -> Path:
        full = (workspace / rel).resolve()
        full.relative_to(workspace)  # raises ValueError if escaping
        return full

    async def read_file(path: str) -> str:
        try:
            full = _resolve(path)
        except ValueError:
            return f"Error: Path '{path}' escapes workspace"
        if not full.exists():
            return f"Error: File not found: {path}"
        if not full.is_file():
            return f"Error: Not a file: {path}"
        content = full.read_text(encoding="utf-8", errors="replace")
        return content[:50000] + "\n\n... (truncated)" if len(content) > 50000 else content

    async def write_file(path: str, content: str) -> str:
        try:
            full = _resolve(path)
        except ValueError:
            return f"Error: Path '{path}' escapes workspace"
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(content, encoding="utf-8")
        return f"Wrote {len(content)} chars to {path}"

    async def edit_file(file_path: str, old_string: str, new_string: str) -> str:
        try:
            full = _resolve(file_path)
        except ValueError:
            return "Error: Path escapes workspace"
        if not full.exists():
            return f"Error: File not found: {file_path}"
        text = full.read_text(encoding="utf-8")
        if old_string not in text:
            return f"Error: old_string not found in {file_path}"
        full.write_text(text.replace(old_string, new_string, 1), encoding="utf-8")
        return f"Edited {file_path}"

    async def list_files(path: str = ".", recursive: bool = False) -> str:
        try:
            target = _resolve(path)
        except ValueError:
            return f"Error: Path escapes workspace"
        if not target.is_dir():
            return f"Error: Not a directory: {path}"
        skip = {".git", "node_modules", "__pycache__", ".venv", "venv", ".next", "dist", "build"}
        results = []
        def collect(d, depth=0):
            if depth > (10 if recursive else 0) or len(results) >= 200:
                return
            try:
                for entry in sorted(d.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
                    if entry.name in skip or len(results) >= 200:
                        continue
                    rel = entry.relative_to(workspace)
                    results.append(f"{rel}/" if entry.is_dir() else str(rel))
                    if entry.is_dir() and recursive:
                        collect(entry, depth + 1)
            except PermissionError:
                pass
        collect(target)
        return "\n".join(results) if results else f"Directory '{path}' is empty"

    async def search_files(path: str, regex: str, file_pattern: str = "") -> str:
        import fnmatch
        try:
            target = _resolve(path)
        except ValueError:
            return f"Error: Path escapes workspace"
        if not target.is_dir():
            return f"Error: Not a directory: {path}"
        try:
            pattern = re.compile(regex)
        except re.error as e:
            return f"Error: Invalid regex: {e}"
        skip = {".git", "node_modules", "__pycache__", ".venv", "venv"}
        files = []
        def collect(d):
            try:
                for entry in d.iterdir():
                    if entry.name in skip:
                        continue
                    if entry.is_dir():
                        collect(entry)
                    elif entry.is_file():
                        if file_pattern and not fnmatch.fnmatch(entry.name, file_pattern):
                            continue
                        files.append(entry)
            except PermissionError:
                pass
        collect(target)
        output_parts, total = [], 0
        for fp in files:
            if total >= 100:
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
                if total >= 100:
                    break
                parts.append(f"  {num:>4} > {line[:300]}")
                total += 1
            output_parts.append(f"{rel}:\n" + "\n".join(parts))
        return "\n\n".join(output_parts) if output_parts else f"No matches for '{regex}' in {path}"

    async def execute_command(command: str, cwd: str = "") -> str:
        import asyncio
        blocklist = ["rm -rf /", "rm -rf ~", "mkfs", "dd if=", "chmod -R 777"]
        for b in blocklist:
            if b in command.lower():
                return f"Error: Blocked dangerous command: {b}"
        work_dir = workspace
        if cwd:
            work_dir = (workspace / cwd).resolve()
            try:
                work_dir.relative_to(workspace)
            except ValueError:
                return "Error: cwd escapes workspace"
        try:
            proc = await asyncio.create_subprocess_shell(
                command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT, cwd=str(work_dir))
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=120)
            output = stdout.decode("utf-8", errors="replace")
            if len(output) > 50000:
                output = output[:10000] + "\n...(truncated)...\n" + output[-10000:]
            status = "" if proc.returncode == 0 else f"Exit code: {proc.returncode}\n"
            return f"{status}{output}"
        except Exception as e:
            return f"Error: {e}"

    return {
        "read_file": read_file,
        "write_file": write_file,
        "edit_file": edit_file,
        "list_files": list_files,
        "search_files": search_files,
        "execute_command": execute_command,
    }


# ---------------------------------------------------------------------------
# Agent: simple tool-calling loop
# ---------------------------------------------------------------------------

class CortexAgent:
    """Stateless agent that runs a tool-calling loop with MiniMax M2.5."""

    def __init__(self, workspace_root: str):
        self.workspace = Path(workspace_root).resolve()
        self.client = AsyncOpenAI(
            api_key=os.getenv("MINIMAX_API_KEY"),
            base_url="https://api.minimax.io/v1",
        )
        self.tools_schema = _build_tools_schema()

        # Build handler dispatch table
        file_handlers = _build_file_handlers(self.workspace)
        self._handlers = {
            "exa_search": _exec_exa_search,
            "web_fetch": _exec_web_fetch,
            "generate_image": _exec_generate_image,
            **file_handlers,
        }

    async def run(
        self,
        messages: list[dict],
        context: str | None = None,
    ) -> dict:
        """
        Run the agent loop.

        Args:
            messages: List of {"role": ..., "content": ...} dicts from the frontend.
            context: Optional page context to prepend to the first user message.

        Returns:
            {"reply": str, "tools_used": list[dict]}
        """
        # Build message list with system prompt
        api_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        for i, msg in enumerate(messages):
            content = msg["content"]
            # Prepend context to first user message
            if msg["role"] == "user" and context and i == 0:
                content = f"[Page context: {context[:2000]}]\n\n{content}"
            api_messages.append({"role": msg["role"], "content": content})

        tools_used: list[dict] = []

        for _round in range(MAX_TOOL_ROUNDS):
            resp = await self.client.chat.completions.create(
                model="MiniMax-M2.5",
                messages=api_messages,
                tools=self.tools_schema,
                temperature=0.7,
            )
            choice = resp.choices[0]

            # If no tool calls, we're done
            if not choice.message.tool_calls:
                reply = choice.message.content or ""
                reply = re.sub(r"<think>.*?</think>", "", reply, flags=re.DOTALL).strip()
                return {"reply": reply, "tools_used": tools_used}

            # Append assistant message with tool calls
            api_messages.append(choice.message.model_dump())

            # Execute each tool call
            for tc in choice.message.tool_calls:
                fn_name = tc.function.name
                try:
                    args = json.loads(tc.function.arguments)
                except json.JSONDecodeError:
                    args = {}

                # Track for frontend
                tools_used.append({
                    "name": fn_name,
                    "args": {k: (v[:100] + "..." if isinstance(v, str) and len(v) > 100 else v)
                             for k, v in args.items()},
                })

                # Execute
                handler = self._handlers.get(fn_name)
                if handler:
                    try:
                        result = await handler(**args)
                    except Exception as e:
                        result = f"Error executing {fn_name}: {e}"
                else:
                    result = f"Error: Unknown tool '{fn_name}'"

                # Append tool result
                api_messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": str(result),
                })

        # Exceeded max rounds — get a final response without tools
        resp = await self.client.chat.completions.create(
            model="MiniMax-M2.5",
            messages=api_messages,
            temperature=0.7,
        )
        reply = resp.choices[0].message.content or ""
        reply = re.sub(r"<think>.*?</think>", "", reply, flags=re.DOTALL).strip()
        return {"reply": reply, "tools_used": tools_used}
