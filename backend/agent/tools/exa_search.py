"""Exa web search tool — semantic search via Exa API.

Uses the exa-py package (already in requirements.txt).
Requires EXA_API_KEY environment variable.
"""

import os
from pathlib import Path


MAX_RESULTS = 10


def create_exa_search_tools(workspace_root: str | Path | None = None) -> dict:
    """Create Exa search tool handlers."""

    async def exa_search_handler(query: str, max_results: int = MAX_RESULTS, search_type: str = "auto") -> str:
        if not query:
            return "Error: Missing 'query' parameter"

        api_key = os.getenv("EXA_API_KEY")
        if not api_key:
            return "Error: EXA_API_KEY environment variable not set"

        try:
            from exa_py import Exa
            exa = Exa(api_key=api_key)

            results = exa.search_and_contents(
                query,
                num_results=min(max_results, 10),
                type=search_type,
                text={"max_characters": 1000},
                highlights=True,
            )
        except ImportError:
            return "Error: exa-py is not installed. Run: pip install exa-py"
        except Exception as e:
            return f"Error: Exa search failed: {e}"

        if not results.results:
            return f"No results found for '{query}'"

        lines = [f"## Search Results for '{query}' (Exa)", ""]
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

    async def exa_find_similar_handler(url: str, max_results: int = 5) -> str:
        if not url:
            return "Error: Missing 'url' parameter"

        api_key = os.getenv("EXA_API_KEY")
        if not api_key:
            return "Error: EXA_API_KEY environment variable not set"

        try:
            from exa_py import Exa
            exa = Exa(api_key=api_key)

            results = exa.find_similar_and_contents(
                url,
                num_results=min(max_results, 10),
                text={"max_characters": 500},
            )
        except ImportError:
            return "Error: exa-py is not installed. Run: pip install exa-py"
        except Exception as e:
            return f"Error: Exa find_similar failed: {e}"

        if not results.results:
            return f"No similar pages found for '{url}'"

        lines = [f"## Pages Similar to {url}", ""]
        for i, r in enumerate(results.results, 1):
            lines.append(f"### {i}. {r.title or 'No title'}")
            if r.url:
                lines.append(f"URL: {r.url}")
            if hasattr(r, "text") and r.text:
                text = r.text[:300]
                if len(r.text) > 300:
                    text += "..."
                lines.append(text)
            lines.append("---")

        return "\n".join(lines)

    return {
        "exa_search": {
            "handler": exa_search_handler,
            "description": (
                "Search the web using Exa's semantic search. Returns results with "
                "content highlights. Best for finding specific information, research, "
                "and learning resources."
            ),
            "parameters": [
                {"name": "query", "type": "string", "description": "The search query", "required": True},
                {"name": "max_results", "type": "number", "description": "Max results (default: 10)", "required": False},
                {"name": "search_type", "type": "string", "description": "Search type: 'auto', 'neural', or 'keyword' (default: auto)", "required": False},
            ],
        },
        "exa_find_similar": {
            "handler": exa_find_similar_handler,
            "description": (
                "Find web pages similar to a given URL. "
                "Use this to discover related resources and content."
            ),
            "parameters": [
                {"name": "url", "type": "string", "description": "URL to find similar pages for", "required": True},
                {"name": "max_results", "type": "number", "description": "Max results (default: 5)", "required": False},
            ],
        },
    }
