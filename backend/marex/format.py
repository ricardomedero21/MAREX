from __future__ import annotations

_DIRS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]


def cardinal(deg: float) -> str:
    """Convierte grados (0-360) al punto cardinal más cercano."""
    return _DIRS[round((deg % 360) / 45) % 8]
