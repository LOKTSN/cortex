"""Web fetch tool — fetch a URL and return clean Markdown content.

Uses httpx + trafilatura (both already in requirements.txt) instead of
crawl4ai to avoid the heavy playwright/chromium dependency.
"""

import httpx
from pathlib import Path

MAX_CHARS = 50_000
DEFAULT_TIMEOUT = 30

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


def create_web_fetch_tools(workspace_root: str | Path | None = None) -> dict:
    """Create web fetch tool handlers."""

    async def web_fetch_handler(url: str) -> str:
        if not url:
            return "Error: Missing 'url' parameter"

        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=DEFAULT_TIMEOUT,
                headers={"User-Agent": USER_AGENT},
            ) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                html = resp.text
        except Exception as e:
            return f"Error: Failed to fetch {url}: {e}"

        # Extract clean text with trafilatura
        try:
            import trafilatura
            content = trafilatura.extract(
                html,
                include_links=True,
                include_tables=True,
                output_format="txt",
            )
        except ImportError:
            # Fallback: strip tags naively
            import re
            content = re.sub(r"<[^>]+>", " ", html)
            content = re.sub(r"\s+", " ", content).strip()

        if not content or len(content.strip()) < 50:
            return f"Error: Page returned empty or minimal content: {url}"

        if len(content) > MAX_CHARS:
            content = content[:MAX_CHARS] + "\n\n... (truncated)"

        return content

    return {
        "web_fetch": {
            "handler": web_fetch_handler,
            "description": (
                "Fetch a web page and return its content as clean text. "
                "Use this to read the full content of a URL."
            ),
            "parameters": [
                {"name": "url", "type": "string", "description": "The URL to fetch", "required": True},
            ],
        },
    }
