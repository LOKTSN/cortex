#!/usr/bin/env bash
# Spawn the coding agent in a tmux session that the MCP spawner auto-discovers.
#
# Usage: ./spawn.sh <workspace_dir> [initial_prompt] [session_id]
#
# Creates a tmux session named task_<timestamp><hex> running the agent REPL.
# The MCP spawner's auto-discovery finds it because the name matches
# SESSION_PREFIXES ("task_", ...) and the JSONL is written to
# ~/.claude/projects/{encoded_dir}/ where discover_jsonl() looks.

set -euo pipefail

WORKSPACE="${1:?Usage: spawn.sh <workspace_dir> [initial_prompt] [session_id]}"
INITIAL_PROMPT="${2:-}"
SESSION_ID="${3:-$(python3 -c 'import uuid; print(uuid.uuid4())')}"

# Generate session name matching spawner's task_ prefix
SUFFIX=$(date +%H%M%S)$(python3 -c 'import secrets; print(secrets.token_hex(1))')
SESSION_NAME="task_${SUFFIX}"

# Path to the REPL script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPL="${SCRIPT_DIR}/repl.py"

# Source .env from workspace (if it exists) to pick up API keys
ENV_FILE="${WORKSPACE}/.env"
ENV_SOURCE=""
if [ -f "${ENV_FILE}" ]; then
    ENV_SOURCE="set -a; source ${ENV_FILE}; set +a; "
fi

# Build env vars for the REPL
ENV_VARS="AGENT_SESSION_ID=${SESSION_ID}"
if [ -n "${INITIAL_PROMPT}" ]; then
    # Escape single quotes for shell embedding
    SAFE_PROMPT=$(printf '%s' "$INITIAL_PROMPT" | sed "s/'/'\\\\''/g")
    ENV_VARS="${ENV_VARS} AGENT_INITIAL_PROMPT='${SAFE_PROMPT}'"
fi

# Forward API keys from current environment (override .env if set)
[ -n "${MINIMAX_API_KEY:-}" ] && ENV_VARS="${ENV_VARS} MINIMAX_API_KEY=${MINIMAX_API_KEY}"
[ -n "${EXA_API_KEY:-}" ] && ENV_VARS="${ENV_VARS} EXA_API_KEY=${EXA_API_KEY}"

CMD="${ENV_SOURCE}${ENV_VARS} python3 ${REPL} ${WORKSPACE}"

# Create detached tmux session
tmux new-session -d -s "${SESSION_NAME}" -c "${WORKSPACE}" -x 200 -y 50 "${CMD}"
tmux set-option -t "${SESSION_NAME}" mouse on

# Write session metadata for dashboard/spawner compatibility
META_DIR="${HOME}/.claude-spawner/sessions"
mkdir -p "${META_DIR}"

# Compute JSONL path (must match session_store.py logic)
ENCODED_DIR=$(python3 -c "import sys; print(sys.argv[1].replace('/', '-').replace('_', '-'))" "${WORKSPACE}")
JSONL_PATH="${HOME}/.claude/projects/${ENCODED_DIR}/${SESSION_ID}.jsonl"

cat > "${META_DIR}/${SESSION_NAME}.json" << EOMETA
{
  "session_name": "${SESSION_NAME}",
  "working_dir": "${WORKSPACE}",
  "claude_session_id": "${SESSION_ID}",
  "jsonl_path": "${JSONL_PATH}",
  "agent_role": "task-agent"
}
EOMETA

echo "Session: ${SESSION_NAME}"
echo "Session ID: ${SESSION_ID}"
echo "JSONL: ${JSONL_PATH}"
echo "Attach: tmux attach -t ${SESSION_NAME}"
