from __future__ import annotations

import os

from marex.sources.base import DataSource
from marex.sources.simulator import SimulatorSource


def source_from_env() -> DataSource:
    """Fuente de datos según MAREX_DATA_SOURCE: simulator (default) | can."""
    if os.environ.get("MAREX_DATA_SOURCE", "simulator") == "can":
        from marex.sources.can_source import SocketCanSource

        return SocketCanSource(channel=os.environ.get("MAREX_CAN_CHANNEL", "can0"))
    return SimulatorSource(interval=1.0)
