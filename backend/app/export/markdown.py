"""Answers are written in Markdown; the report renders them to HTML.

Raw HTML is never interpreted (it is shown as text), and markdown-it refuses `javascript:` and
similar links. A single line break stays a line break, as people wrote before Markdown.
"""

from functools import cache

from markdown_it import MarkdownIt
from markupsafe import Markup


@cache
def _parser() -> MarkdownIt:
    return MarkdownIt("commonmark", {"html": False, "breaks": True}).enable(
        ["table", "strikethrough"]
    )


def render_markdown(text: str | None) -> Markup:
    # The parser escapes everything it does not turn into markup, so the result is safe HTML.
    return Markup(_parser().render(text or ""))
