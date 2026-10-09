"""A small in-memory sliding-window limiter: enough for a single server process."""

import threading
import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, limit: int, window_seconds: float) -> None:
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _recent(self, key: str, now: float) -> deque[float]:
        hits = self._hits[key]
        while hits and hits[0] <= now - self.window:
            hits.popleft()
        return hits

    def is_limited(self, key: str) -> bool:
        with self._lock:
            return len(self._recent(key, time.monotonic())) >= self.limit

    def hit(self, key: str) -> None:
        with self._lock:
            now = time.monotonic()
            self._recent(key, now).append(now)

    def reset(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._hits.clear()
            else:
                self._hits.pop(key, None)


# Failed logins per email; account-related email requests per client IP.
failed_logins = RateLimiter(limit=5, window_seconds=15 * 60)
email_requests = RateLimiter(limit=5, window_seconds=60 * 60)
# Visits to shared pages per client IP; PDFs cost more to render, so they have their own limit.
shared_pages = RateLimiter(limit=60, window_seconds=60)
shared_pdfs = RateLimiter(limit=10, window_seconds=60)
# Every /api request per client IP: a ceiling well above what one person clicking can reach.
api_requests = RateLimiter(limit=300, window_seconds=60)
