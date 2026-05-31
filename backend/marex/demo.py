"""Demo manual: corre el simulador, guarda en SQLite e imprime el ultimo valor.

Uso (desde backend/, con el venv activo):
    python -m marex.demo
Cortar con Ctrl+C.
"""

from __future__ import annotations

import itertools

from marex.signals import SignalType
from marex.sources.simulator import SimulatorSource
from marex.storage import SignalStore


def main() -> None:
    source = SimulatorSource(interval=1.0)
    store = SignalStore("marex.db")
    print("Marex demo: simulador -> SQLite. Ctrl+C para salir.\n")
    try:
        for tick in itertools.islice(source.stream(), 5):
            store.append_many(tick)
            depth = store.latest(SignalType.DEPTH)
            sog = store.latest(SignalType.SOG)
            print(f"depth={depth.value:5.1f} m   sog={sog.value:4.1f} kn")
    finally:
        store.close()


if __name__ == "__main__":
    main()
