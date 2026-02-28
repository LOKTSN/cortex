"""CopilotKit integration — mount the LangGraph agent as a FastAPI endpoint.

Uses the CopilotKit Python SDK (0.1.x) to expose the LangGraph agent
via CopilotKit's remote-endpoint protocol.
"""

import types
import sys
import logging
from pathlib import Path

# ---- langgraph compat shim ------------------------------------------------
# copilotkit 0.1.39 imports `from langgraph.graph.graph import CompiledGraph`
# which was removed in langgraph >=0.5.  Shim it with Pregel (its successor).
from langgraph.pregel import Pregel as _Pregel  # noqa: E402

_compat = types.ModuleType("langgraph.graph.graph")
_compat.CompiledGraph = _Pregel
sys.modules["langgraph.graph.graph"] = _compat
# ---------------------------------------------------------------------------

from copilotkit import CopilotKitRemoteEndpoint, LangGraphAgent  # noqa: E402
from copilotkit.integrations.fastapi import add_fastapi_endpoint  # noqa: E402

from agent.graph import build_graph  # noqa: E402

logger = logging.getLogger(__name__)


def setup_copilotkit(app, workspace_root: str | Path, prefix: str = "/api/copilotkit"):
    """Create the CopilotKit remote endpoint and mount it on FastAPI."""
    workspace = str(Path(workspace_root).resolve())
    graph = build_graph(workspace)

    agent = LangGraphAgent(
        name="cortex_agent",
        description=(
            "Cortex AI learning companion — searches the web, reads pages, "
            "synthesizes information, and helps with coding tasks."
        ),
        graph=graph,
    )

    sdk = CopilotKitRemoteEndpoint(agents=[agent])

    add_fastapi_endpoint(fastapi_app=app, sdk=sdk, prefix=prefix)
    logger.info("CopilotKit endpoint mounted at %s", prefix)
