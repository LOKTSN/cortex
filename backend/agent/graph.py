"""LangGraph agent for Cortex — search, read, synthesize, teach.

Uses MiniMax M2.5 as the LLM. Tools: Exa search, web fetch, file ops, shell.
"""

import os
from pathlib import Path
from typing import Optional

from langchain_core.tools import tool
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph
from langgraph.prebuilt import ToolNode

import httpx

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


def build_graph(workspace_root: str):
    """Build the LangGraph agent with all tools scoped to workspace_root."""
    workspace = Path(workspace_root).resolve()

    # ------------------------------------------------------------------
    # Tools
    # ------------------------------------------------------------------

    @tool
    async def exa_search(query: str, max_results: int = 5) -> str:
        """Search the web using Exa semantic search. Returns results with titles, URLs, and content highlights. Use this to find current information about any topic."""
        api_key = os.getenv("EXA_API_KEY")
        if not api_key:
            return "Error: EXA_API_KEY not set"
        try:
            from exa_py import Exa
            exa = Exa(api_key=api_key)
            results = exa.search_and_contents(
                query,
                num_results=min(max_results, 10),
                type="auto",
                text={"max_characters": 1000},
                highlights=True,
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
                text = r.text[:500]
                if len(r.text) > 500:
                    text += "..."
                lines.append(text)
            lines.append("---")
        return "\n".join(lines)

    @tool
    async def web_fetch(url: str) -> str:
        """Fetch a web page and return its content as clean text. Use this to read the full content of a URL from search results."""
        if not url:
            return "Error: Missing URL"
        try:
            async with httpx.AsyncClient(
                follow_redirects=True, timeout=30,
                headers={"User-Agent": "Mozilla/5.0 (compatible; Cortex/1.0)"},
            ) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                html = resp.text
        except Exception as e:
            return f"Error fetching {url}: {e}"

        try:
            import trafilatura
            content = trafilatura.extract(html, include_links=True, include_tables=True, output_format="txt")
        except ImportError:
            import re
            content = re.sub(r"<[^>]+>", " ", html)
            content = re.sub(r"\s+", " ", content).strip()

        if not content or len(content.strip()) < 50:
            return f"Page returned empty or minimal content: {url}"
        if len(content) > 30000:
            content = content[:30000] + "\n\n... (truncated)"
        return content

    @tool
    async def read_file(path: str) -> str:
        """Read a file from the workspace. Path is relative to workspace root."""
        full = (workspace / path).resolve()
        try:
            full.relative_to(workspace)
        except ValueError:
            return f"Error: Path '{path}' escapes workspace"
        if not full.exists():
            return f"Error: File not found: {path}"
        if not full.is_file():
            return f"Error: Not a file: {path}"
        try:
            content = full.read_text(encoding="utf-8", errors="replace")
            if len(content) > 50000:
                content = content[:50000] + "\n\n... (truncated)"
            return content
        except Exception as e:
            return f"Error reading {path}: {e}"

    @tool
    async def write_file(path: str, content: str) -> str:
        """Write content to a file in the workspace. Creates directories if needed. Path is relative to workspace root."""
        full = (workspace / path).resolve()
        try:
            full.relative_to(workspace)
        except ValueError:
            return f"Error: Path '{path}' escapes workspace"
        full.parent.mkdir(parents=True, exist_ok=True)
        try:
            full.write_text(content, encoding="utf-8")
            return f"Wrote {len(content)} chars to {path}"
        except Exception as e:
            return f"Error writing {path}: {e}"

    @tool
    async def edit_file(file_path: str, old_string: str, new_string: str) -> str:
        """Replace exact text in a file. old_string must match exactly."""
        full = (workspace / file_path).resolve()
        try:
            full.relative_to(workspace)
        except ValueError:
            return f"Error: Path escapes workspace"
        if not full.exists():
            return f"Error: File not found: {file_path}"
        text = full.read_text(encoding="utf-8")
        if old_string not in text:
            return f"Error: old_string not found in {file_path}"
        new_text = text.replace(old_string, new_string, 1)
        full.write_text(new_text, encoding="utf-8")
        return f"Edited {file_path}"

    @tool
    async def list_files(path: str = ".", recursive: bool = False) -> str:
        """List files and directories in the workspace."""
        target = (workspace / path).resolve()
        try:
            target.relative_to(workspace)
        except ValueError:
            return f"Error: Path escapes workspace"
        if not target.is_dir():
            return f"Error: Not a directory: {path}"

        results = []
        skip = {".git", "node_modules", "__pycache__", ".venv", "venv", ".next", "dist", "build"}
        def collect(d, depth=0):
            if depth > (10 if recursive else 0):
                return
            try:
                for entry in sorted(d.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
                    if entry.name in skip:
                        continue
                    if len(results) >= 200:
                        return
                    rel = entry.relative_to(workspace)
                    if entry.is_dir():
                        results.append(f"{rel}/")
                        if recursive:
                            collect(entry, depth + 1)
                    else:
                        results.append(str(rel))
            except PermissionError:
                pass
        collect(target)
        return "\n".join(results) if results else f"Directory '{path}' is empty"

    @tool
    async def search_files(path: str, regex: str, file_pattern: str = "") -> str:
        """Search for a regex pattern across files in the workspace. Returns matching lines with line numbers."""
        import re as re_mod
        import fnmatch
        target = (workspace / path).resolve()
        try:
            target.relative_to(workspace)
        except ValueError:
            return f"Error: Path escapes workspace"
        if not target.is_dir():
            return f"Error: Not a directory: {path}"
        try:
            pattern = re_mod.compile(regex)
        except re_mod.error as e:
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

        output_parts = []
        total = 0
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
                if len(line) > 300:
                    line = line[:300] + "..."
                parts.append(f"  {num:>4} > {line}")
                total += 1
            output_parts.append(f"{rel}:\n" + "\n".join(parts))

        if not output_parts:
            return f"No matches for '{regex}' in {path}"
        return "\n\n".join(output_parts)

    @tool
    async def execute_command(command: str, cwd: str = "") -> str:
        """Execute a shell command in the workspace. Blocked: package installs, dangerous ops."""
        import asyncio
        blocklist = ["rm -rf /", "rm -rf ~", "mkfs", "dd if=", "chmod -R 777"]
        cmd_lower = command.lower()
        for b in blocklist:
            if b in cmd_lower:
                return f"Error: Blocked dangerous command: {b}"

        work_dir = workspace
        if cwd:
            work_dir = (workspace / cwd).resolve()
            try:
                work_dir.relative_to(workspace)
            except ValueError:
                return f"Error: cwd escapes workspace"

        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=str(work_dir),
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=120)
            output = stdout.decode("utf-8", errors="replace")
            if len(output) > 50000:
                output = output[:10000] + "\n...(truncated)...\n" + output[-10000:]
            status = "" if proc.returncode == 0 else f"Exit code: {proc.returncode}\n"
            return f"{status}{output}"
        except asyncio.TimeoutError:
            return "Error: Command timed out after 120s"
        except Exception as e:
            return f"Error: {e}"

    @tool
    async def generate_image(prompt: str, aspect_ratio: str = "16:9") -> str:
        """Generate an image using MiniMax image-01 model. Returns a markdown image tag that will render in chat. Use this when the user asks you to create, generate, draw, or visualize an image, diagram, illustration, or picture. The prompt should be a detailed visual description in English."""
        api_key = os.getenv("MINIMAX_API_KEY")
        if not api_key:
            return "Error: MINIMAX_API_KEY not set"
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://api.minimax.io/v1/image_generation",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "image-01",
                        "prompt": prompt,
                        "aspect_ratio": aspect_ratio,
                        "n": 1,
                        "response_format": "url",
                        "prompt_optimizer": True,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as e:
            return f"Error generating image: {e}"

        urls = data.get("data", {}).get("image_urls", [])
        if not urls:
            status = data.get("base_resp", {}).get("status_msg", "unknown error")
            return f"Image generation failed: {status}"
        return f"![Generated image]({urls[0]})"

    # ------------------------------------------------------------------
    # Graph
    # ------------------------------------------------------------------

    all_tools = [
        exa_search, web_fetch, generate_image,
        read_file, write_file, edit_file,
        list_files, search_files, execute_command,
    ]

    async def chat_node(state: MessagesState, config: RunnableConfig):
        model = ChatOpenAI(
            model="MiniMax-M2.5",
            base_url="https://api.minimax.io/v1",
            api_key=os.getenv("MINIMAX_API_KEY"),
            temperature=0.7,
        )
        model_with_tools = model.bind_tools(all_tools)
        response = await model_with_tools.ainvoke(
            [SystemMessage(content=SYSTEM_PROMPT), *state["messages"]],
            config,
        )
        return {"messages": [response]}

    def should_continue(state: MessagesState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return "__end__"

    workflow = StateGraph(MessagesState)
    workflow.add_node("chat", chat_node)
    workflow.add_node("tools", ToolNode(tools=all_tools))
    workflow.set_entry_point("chat")
    workflow.add_conditional_edges("chat", should_continue, {"tools": "tools", "__end__": "__end__"})
    workflow.add_edge("tools", "chat")

    return workflow.compile(checkpointer=MemorySaver())
