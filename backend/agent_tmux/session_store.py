"""Write/read Claude-compatible JSONL for MCP spawner integration.

Writes entries to ~/.claude/projects/{encoded_dir}/{session_id}.jsonl
in the same format the spawner's jsonl_reader.py expects, so all existing
spawner tools (tmux_get_output, tmux_send_message, etc.) work without
any modification via auto-discovery.

Extra fields (messages_snapshot, stats) are ignored by the existing reader
but used by our own resume logic.
"""

import json
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CLAUDE_PROJECTS_DIR = Path.home() / ".claude" / "projects"


def _encode_path(working_dir: str) -> str:
    """Match Claude CLI's path encoding: / and _ become -."""
    return working_dir.replace("/", "-").replace("_", "-")


def _uuid() -> str:
    return secrets.token_hex(8)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def jsonl_path_for(session_id: str, working_dir: str) -> Path:
    """Compute the JSONL path where the spawner will look for it."""
    encoded = _encode_path(working_dir)
    return CLAUDE_PROJECTS_DIR / encoded / f"{session_id}.jsonl"


class SessionStore:
    """Appends Claude-compatible JSONL entries for spawner integration.

    Entry types match what jsonl_reader.py expects:
    - type: "user"      → read_session_summary tracks working/idle state
    - type: "assistant"  → read_assistant_messages extracts message text
    - type: "system" + subtype: "turn_duration" → signals idle (turn boundary)
    """

    def __init__(self, session_id: str, working_dir: str):
        self.session_id = session_id
        self.path = jsonl_path_for(session_id, working_dir)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        # Write init entry immediately so the file exists with newest mtime.
        # This ensures discover_jsonl() picks THIS file (not an older session's)
        # when auto-discover runs. The reader ignores non-standard subtypes.
        if not self.path.exists():
            self._append({
                "uuid": f"i-{_uuid()}",
                "type": "system",
                "subtype": "init",
                "timestamp": _now(),
                "message": {
                    "role": "system",
                    "content": [{"type": "text", "text": ""}],
                },
            })

    def write_user(self, text: str) -> None:
        """Write user entry immediately — grows file for send_keys verification."""
        self._append({
            "uuid": f"u-{_uuid()}",
            "type": "user",
            "timestamp": _now(),
            "message": {
                "role": "user",
                "content": [{"type": "text", "text": text}],
            },
        })

    def write_assistant(self, text: str) -> None:
        """Write assistant response."""
        self._append({
            "uuid": f"a-{_uuid()}",
            "type": "assistant",
            "timestamp": _now(),
            "message": {
                "role": "assistant",
                "content": [{"type": "text", "text": text}],
            },
        })

    def write_idle(
        self,
        messages_snapshot: list[dict[str, Any]],
        stats: dict[str, Any] | None = None,
        tools_used: list[str] | None = None,
    ) -> None:
        """Write turn_duration marker — signals idle + carries resume data."""
        self._append({
            "uuid": f"s-{_uuid()}",
            "type": "system",
            "subtype": "turn_duration",
            "timestamp": _now(),
            "message": {
                "role": "system",
                "content": [{"type": "text", "text": ""}],
            },
            "messages_snapshot": messages_snapshot,
            "stats": stats or {},
            "tools_used": tools_used or [],
        })

    def _append(self, entry: dict) -> None:
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

    @classmethod
    def load_messages(cls, session_id: str, working_dir: str) -> list[dict] | None:
        """Load the last messages_snapshot from an existing session file.

        Returns list of message dicts or None if no prior session exists.
        Used to restore conversation history for session resume.
        """
        path = jsonl_path_for(session_id, working_dir)
        if not path.exists():
            return None
        last_snapshot = None
        for line in path.read_text(encoding="utf-8").splitlines():
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if entry.get("type") == "system" and "messages_snapshot" in entry:
                last_snapshot = entry["messages_snapshot"]
        return last_snapshot
