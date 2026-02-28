"""CopilotKit AG-UI integration — LangGraph agent endpoint.

Uses ag-ui-langgraph to create an AG-UI compatible SSE endpoint
that CopilotKit's React frontend connects to directly.
"""

import logging
from pathlib import Path

from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

from agent.graph import build_graph

logger = logging.getLogger(__name__)


def setup_copilotkit(app, workspace_root: str | Path, prefix: str = "/api/copilotkit"):
    """Create the AG-UI endpoint and mount it on FastAPI."""
    workspace = str(Path(workspace_root).resolve())
    graph = build_graph(workspace)

    agent = LangGraphAGUIAgent(
        name="cortex_agent",
        description=(
            "Cortex AI learning companion — searches the web, reads pages, "
            "synthesizes information, and helps with coding tasks."
        ),
        graph=graph,
    )

    add_langgraph_fastapi_endpoint(app=app, agent=agent, path=prefix)
    logger.info(f"CopilotKit AG-UI endpoint mounted at {prefix}")
