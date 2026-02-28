"""Utility functions for file tools."""

from pathlib import Path

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}

BINARY_SIGNATURES = {
    b"\x89PNG": "png",
    b"\xff\xd8\xff": "jpg",
    b"GIF8": "gif",
    b"%PDF": "pdf",
    b"PK\x03\x04": "zip",
}


def is_binary_file(path: Path) -> bool:
    try:
        with open(path, "rb") as f:
            chunk = f.read(8192)
        return b"\x00" in chunk
    except (OSError, IOError):
        return False


def is_image_file(path: Path) -> bool:
    return path.suffix.lower() in IMAGE_EXTENSIONS


def clean_file_content(content: str) -> str:
    lines = content.split("\n")
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines)


def read_line_ranges(
    path: Path,
    ranges: list[list[int]] | None = None,
    add_line_numbers: bool = True,
) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        all_lines = f.readlines()

    if ranges is None:
        selected_lines = list(enumerate(all_lines, start=1))
    else:
        selected_lines = []
        for start, end in ranges:
            start_idx = max(0, start - 1)
            end_idx = min(len(all_lines), end)
            for i in range(start_idx, end_idx):
                selected_lines.append((i + 1, all_lines[i]))

    if add_line_numbers:
        max_num = max((num for num, _ in selected_lines), default=1)
        width = len(str(max_num))
        result_lines = [f"{num:>{width}} | {line.rstrip()}" for num, line in selected_lines]
    else:
        result_lines = [line.rstrip() for _, line in selected_lines]

    return "\n".join(result_lines)


def compress_output(
    output: str,
    max_lines: int = 500,
    max_chars: int = 100000,
) -> str:
    lines = output.split("\n")
    if len(lines) > max_lines:
        half = max_lines // 2
        omitted = len(lines) - max_lines
        lines = lines[:half] + [f"\n... ({omitted} lines omitted) ...\n"] + lines[-half:]
    result = "\n".join(lines)
    if len(result) > max_chars:
        result = result[:max_chars] + "\n... (truncated)"
    return result
