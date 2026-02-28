#!/usr/bin/env python3
"""Spawner-compatible agent REPL.

Creates an interactive loop wrapping CortexAgent with:
- Claude-compatible JSONL output for spawner integration
- ❯ prompt for screen-based idle detection
- Bracketed paste sequence stripping for tmux send-keys compatibility
- Session resume via messages_snapshot

Env vars:
    AGENT_SESSION_ID       — UUID for session file (auto-generated if not set)
    AGENT_INITIAL_PROMPT   — first message (skips input(), used by spawn.sh)
    MINIMAX_API_KEY        — API key for MiniMax M2.5
    EXA_API_KEY            — API key for Exa search (optional)
"""

import asyncio
import os
import sys
import time
import uuid
from pathlib import Path

# Add backend/ to path so we can import agent.agent
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent.agent import CortexAgent
from agent_tmux.session_store import SessionStore

IDLE_PROMPT = "❯ "


def clean_input(raw: str) -> str:
    """Strip bracketed paste escape sequences from tmux send-keys."""
    return raw.replace("\x1b[200~", "").replace("\x1b[201~", "").strip()


async def main():
    workspace = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    session_id = os.environ.get("AGENT_SESSION_ID", str(uuid.uuid4()))
    initial_prompt = os.environ.get("AGENT_INITIAL_PROMPT", "").strip()

    # Initialize session store (writes JSONL to ~/.claude/projects/...)
    store = SessionStore(session_id=session_id, working_dir=str(workspace))

    # Initialize agent
    agent = CortexAgent(workspace_root=str(workspace))

    # Load prior messages if resuming an existing session
    messages: list[dict] = []
    prior = SessionStore.load_messages(session_id, str(workspace))
    if prior:
        messages = prior
        print(f"Resumed session ({len(messages)} messages in context)")

    print("=" * 60)
    print("  CODING AGENT (MiniMax M2.5)")
    print(f"  Session: {session_id}")
    print(f"  Workspace: {workspace}")
    print("  Commands: /exit /new /history")
    print("=" * 60)
    print()

    while True:
        # Get input: initial prompt first, then stdin
        if initial_prompt:
            user_input = initial_prompt
            initial_prompt = ""
            print(f"{IDLE_PROMPT}{user_input}")
        else:
            try:
                user_input = clean_input(input(IDLE_PROMPT))
            except (KeyboardInterrupt, EOFError):
                break

        if not user_input:
            continue
        if user_input.lower() in ("/exit", "/quit"):
            break
        if user_input.lower() == "/new":
            messages = []
            print("--- new conversation ---\n")
            continue
        if user_input.lower() == "/history":
            for i, m in enumerate(messages):
                role = m.get("role", "?")
                content = str(m.get("content", ""))[:80]
                print(f"  [{i}] {role}: {content}")
            print()
            continue

        # 1. Write user entry immediately (grows JSONL for send_keys ack)
        store.write_user(user_input)

        # 2. Add to conversation history
        messages.append({"role": "user", "content": user_input})

        # 3. Run agent
        print()
        t0 = time.time()
        try:
            result = await agent.run(messages)
            elapsed = time.time() - t0
            reply = result.get("reply", "")
            tools_used = [t.get("name", "") for t in result.get("tools_used", [])]

            # 4. Add assistant reply to history
            messages.append({"role": "assistant", "content": reply})

            # 5. Write assistant + idle marker to JSONL
            store.write_assistant(reply)
            store.write_idle(
                messages_snapshot=messages,
                stats={"duration_s": round(elapsed, 2)},
                tools_used=tools_used,
            )

            print(reply)
            print()

        except Exception as e:
            print(f"\nError: {e}\n")


if __name__ == "__main__":
    asyncio.run(main())
