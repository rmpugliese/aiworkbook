"""Serves the frontend build from the backend, for a single origin in production.

Files that exist are served as they are (Vite fingerprints the assets, so they can be cached for a
year); any other path that is not part of the API or the shared pages gets index.html, and the
React router takes over from there.
"""

from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import FileResponse

_IMMUTABLE = {"Cache-Control": "public, max-age=31536000, immutable"}
_REVALIDATE = {"Cache-Control": "no-cache"}


def mount_frontend(app: FastAPI, dist: Path) -> None:
    root = dist.resolve()
    index = root / "index.html"
    if not index.is_file():
        raise RuntimeError(f"APP_FRONTEND_DIST has no index.html: {root}")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str) -> FileResponse:
        if path == "api" or path.startswith(("api/", "s/")):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Not Found")
        candidate = (root / path).resolve()
        if path and candidate.is_file() and candidate.is_relative_to(root):
            headers = _IMMUTABLE if path.startswith("assets/") else _REVALIDATE
            return FileResponse(candidate, headers=headers)
        return FileResponse(index, headers=_REVALIDATE)
