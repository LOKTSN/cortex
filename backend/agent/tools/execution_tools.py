"""Command execution tools for running shell commands in the workspace."""

import asyncio
from pathlib import Path

DEFAULT_LINE_LIMIT = 500
DEFAULT_CHARACTER_LIMIT = 100_000

DEFAULT_COMMAND_BLOCKLIST = [
    "npm install", "npm i ", "npm ci", "yarn install", "yarn add",
    "pnpm install", "pnpm add", "pip install", "pip3 install",
    "conda install", "gem install", "cargo install", "go install",
    "brew install", "apt install", "apt-get install",
    "rm -rf /", "rm -rf ~", "mkfs", "dd if=",
    ":(){:|:&};:", "chmod -R 777",
    "curl | bash", "curl | sh", "wget | bash", "wget | sh",
]


def truncate_output(content: str, line_limit: int = DEFAULT_LINE_LIMIT, char_limit: int = DEFAULT_CHARACTER_LIMIT) -> str:
    if char_limit and len(content) > char_limit:
        before = int(char_limit * 0.2)
        after = char_limit - before
        omitted = len(content) - char_limit
        return f"{content[:before]}\n[...{omitted} characters omitted...]\n{content[-after:]}"
    if line_limit:
        lines = content.split("\n")
        if len(lines) > line_limit:
            before = int(line_limit * 0.2)
            after = line_limit - before
            omitted = len(lines) - line_limit
            return "\n".join(lines[:before]) + f"\n[...{omitted} lines omitted...]\n" + "\n".join(lines[-after:])
    return content


def create_execution_tools(workspace_root: str | Path, default_timeout: float = 120.0) -> dict:
    """Create execution tool handlers."""
    workspace = Path(workspace_root).resolve()
    blocklist = DEFAULT_COMMAND_BLOCKLIST

    def is_blocked(command: str) -> str | None:
        cmd_lower = command.lower()
        for pattern in blocklist:
            if pattern.lower() in cmd_lower:
                return pattern
        return None

    async def execute_command_handler(command: str, cwd: str | None = None) -> str:
        blocked = is_blocked(command)
        if blocked:
            return f"Error: Command blocked: '{blocked}'. Ask the user to run it manually."

        if cwd:
            if Path(cwd).is_absolute():
                work_dir = Path(cwd).resolve()
            else:
                work_dir = (workspace / cwd).resolve()
            try:
                work_dir.relative_to(workspace)
            except ValueError:
                return f"Error: Working directory '{cwd}' escapes workspace"
            if not work_dir.is_dir():
                return f"Error: Working directory '{cwd}' does not exist"
        else:
            work_dir = workspace

        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=str(work_dir),
            )
            try:
                stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=default_timeout)
                output = stdout.decode("utf-8", errors="replace")
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()
                return f"Error: Command timed out after {default_timeout}s"

            compressed = truncate_output(output)
            exit_code = proc.returncode
            status = "" if exit_code == 0 else "Command failed.\n"
            return f"Executed in '{work_dir}'.\n{status}Exit code: {exit_code}\nOutput:\n{compressed}"
        except Exception as e:
            return f"Error: {e}"

    return {
        "execute_command": {
            "handler": execute_command_handler,
            "description": "Execute a CLI command. Tailored to the user's system. Blocked: package installs, dangerous ops.",
            "parameters": [
                {"name": "command", "type": "string", "description": "The CLI command to execute", "required": True},
                {"name": "cwd", "type": "string", "description": "Working directory relative to workspace", "required": False},
            ],
        },
    }
