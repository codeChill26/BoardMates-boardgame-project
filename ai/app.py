"""Convenience entrypoint.

You asked for a quick run path: `python ai/app.py`.

- Dev mode uses `reload=True` (auto-restart when code changes).
- For production, run uvicorn without reload and behind a reverse proxy.
"""

from __future__ import annotations

import uvicorn


def main() -> None:
    uvicorn.run(
       "api.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )


if __name__ == "__main__":
    main()
