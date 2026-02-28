"""Minimal ToolResult for tool handlers — no external dependencies."""

from __future__ import annotations
from typing import Any


class ToolResult:
    """Result from tool execution."""

    __slots__ = ("content", "error", "metadata")

    def __init__(
        self,
        content: str = "",
        error: str | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        self.content = content
        self.error = error
        self.metadata = metadata

    @property
    def is_error(self) -> bool:
        return self.error is not None

    @classmethod
    def success(cls, content: str, metadata: dict[str, Any] | None = None) -> ToolResult:
        return cls(content=content, metadata=metadata)

    @classmethod
    def failure(cls, error: str, content: str = "") -> ToolResult:
        return cls(content=content, error=error)
