from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterator

from marex.signals import Signal


class DataSource(ABC):
    """Fuente de datos del barco. Cada 'tick' es una lista de señales."""

    @abstractmethod
    def stream(self) -> Iterator[list[Signal]]:
        raise NotImplementedError
