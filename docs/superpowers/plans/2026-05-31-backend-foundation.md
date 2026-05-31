# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la base del backend de Marex: un modelo de señales normalizado, una interfaz de fuente de datos intercambiable, un simulador que genera datos NMEA realistas, y un almacenamiento time-series en SQLite.

**Architecture:** Capas aisladas y testeables. `Signal` es el modelo común. `DataSource` es una interfaz abstracta; `SimulatorSource` es la primera implementación (luego vendrán `RecordingSource` y `SerialNmea0183Source`). `SignalStore` persiste señales en SQLite y permite consultar el último valor e histórico. Todo se desarrolla con TDD.

**Tech Stack:** Python 3.11+, pytest, SQLite (módulo `sqlite3` de la stdlib). Sin dependencias externas en esta fase.

**Nota sobre commits:** Los mensajes de commit van en inglés y ASCII (estilo *conventional commits*) para evitar problemas de codificación en la consola de Windows. Ver [[commits-utf8-windows]].

---

## File Structure

```
backend/
  pyproject.toml              # config de pytest (pythonpath, testpaths)
  marex/
    __init__.py
    signals.py                # Signal, SignalType, UNITS
    sources/
      __init__.py
      base.py                 # DataSource (ABC)
      simulator.py            # SimulatorSource
    storage.py                # SignalStore (SQLite)
    demo.py                   # script manual: simulador -> store -> imprime
  tests/
    test_signals.py
    test_base_source.py
    test_simulator.py
    test_storage.py
```

Cada archivo tiene una responsabilidad clara: `signals.py` define el dato; `sources/` produce datos; `storage.py` los persiste; `demo.py` los conecta para una verificación manual.

---

## Task 0: Project setup

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/marex/__init__.py` (vacío)
- Create: `backend/marex/sources/__init__.py` (vacío)

- [ ] **Step 1: Create `backend/pyproject.toml`**

```toml
[project]
name = "marex-backend"
version = "0.1.0"
description = "Marex - cerebro de a bordo (ingestion, alertas, API, LLM)"
requires-python = ">=3.11"

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
```

- [ ] **Step 2: Create empty package files**

Crear `backend/marex/__init__.py` y `backend/marex/sources/__init__.py` vacíos.

- [ ] **Step 3: Create and activate a virtualenv, install pytest**

Run (PowerShell, desde `backend/`):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install pytest
```
Expected: pytest se instala sin errores. (`.venv/` ya está en `.gitignore`.)

- [ ] **Step 4: Verify pytest runs (no tests yet)**

Run (desde `backend/`): `pytest`
Expected: "no tests ran" (exit code 5). Confirma que la config carga.

- [ ] **Step 5: Commit**

```bash
git add backend/pyproject.toml backend/marex/__init__.py backend/marex/sources/__init__.py
git commit -m "chore(backend): project setup with pytest config"
```

---

## Task 1: Signal model

**Files:**
- Create: `backend/marex/signals.py`
- Test: `backend/tests/test_signals.py`

- [ ] **Step 1: Write the failing test**

`backend/tests/test_signals.py`:
```python
from datetime import datetime, timezone

from marex.signals import Signal, SignalType, UNITS


def test_create_sets_unit_from_type():
    s = Signal.create(SignalType.DEPTH, 12.5)
    assert s.type is SignalType.DEPTH
    assert s.value == 12.5
    assert s.unit == "m"
    assert s.timestamp.tzinfo is not None


def test_create_accepts_explicit_timestamp():
    ts = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    s = Signal.create(SignalType.SOG, 6.0, ts)
    assert s.timestamp == ts
    assert s.unit == "kn"


def test_every_signal_type_has_a_unit():
    for t in SignalType:
        assert t in UNITS
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_signals.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'marex.signals'`.

- [ ] **Step 3: Write minimal implementation**

`backend/marex/signals.py`:
```python
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum


class SignalType(str, Enum):
    DEPTH = "depth"           # profundidad bajo la quilla/transductor
    SOG = "sog"               # speed over ground
    COG = "cog"               # course over ground
    LATITUDE = "latitude"
    LONGITUDE = "longitude"
    WIND_SPEED = "wind_speed"
    WIND_ANGLE = "wind_angle"


UNITS: dict[SignalType, str] = {
    SignalType.DEPTH: "m",
    SignalType.SOG: "kn",
    SignalType.COG: "deg",
    SignalType.LATITUDE: "deg",
    SignalType.LONGITUDE: "deg",
    SignalType.WIND_SPEED: "kn",
    SignalType.WIND_ANGLE: "deg",
}


@dataclass(frozen=True)
class Signal:
    type: SignalType
    value: float
    timestamp: datetime
    unit: str

    @classmethod
    def create(
        cls, type: SignalType, value: float, timestamp: datetime | None = None
    ) -> "Signal":
        return cls(
            type=type,
            value=float(value),
            timestamp=timestamp or datetime.now(timezone.utc),
            unit=UNITS[type],
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_signals.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/marex/signals.py backend/tests/test_signals.py
git commit -m "feat(backend): add Signal model and SignalType"
```

---

## Task 2: DataSource interface

**Files:**
- Create: `backend/marex/sources/base.py`
- Test: `backend/tests/test_base_source.py`

- [ ] **Step 1: Write the failing test**

`backend/tests/test_base_source.py`:
```python
import itertools

import pytest

from marex.signals import Signal, SignalType
from marex.sources.base import DataSource


def test_datasource_cannot_be_instantiated_directly():
    with pytest.raises(TypeError):
        DataSource()


def test_concrete_subclass_streams_signals():
    class Fake(DataSource):
        def stream(self):
            while True:
                yield [Signal.create(SignalType.DEPTH, 10.0)]

    ticks = list(itertools.islice(Fake().stream(), 2))
    assert len(ticks) == 2
    assert ticks[0][0].type is SignalType.DEPTH
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_base_source.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'marex.sources.base'`.

- [ ] **Step 3: Write minimal implementation**

`backend/marex/sources/base.py`:
```python
from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterator

from marex.signals import Signal


class DataSource(ABC):
    """Fuente de datos del barco. Cada 'tick' es una lista de señales."""

    @abstractmethod
    def stream(self) -> Iterator[list[Signal]]:
        raise NotImplementedError
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_base_source.py -v`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/marex/sources/base.py backend/tests/test_base_source.py
git commit -m "feat(backend): add DataSource abstract interface"
```

---

## Task 3: SimulatorSource.sample (pure, deterministic)

**Files:**
- Create: `backend/marex/sources/simulator.py`
- Test: `backend/tests/test_simulator.py`

La parte pura (cálculo de valores) se separa de la temporización para poder testearla sin esperas. `sample(elapsed)` devuelve la lista de señales para un instante dado.

- [ ] **Step 1: Write the failing test**

`backend/tests/test_simulator.py`:
```python
from marex.signals import SignalType
from marex.sources.simulator import SimulatorSource


def test_sample_returns_one_signal_per_type():
    sim = SimulatorSource()
    signals = sim.sample(0.0)
    types = {s.type for s in signals}
    assert types == set(SignalType)


def test_sample_values_are_in_realistic_ranges():
    sim = SimulatorSource()
    for elapsed in (0.0, 7.0, 33.0, 120.0):
        by_type = {s.type: s.value for s in sim.sample(elapsed)}
        assert 10.0 <= by_type[SignalType.DEPTH] <= 20.0
        assert 4.0 <= by_type[SignalType.SOG] <= 8.0
        assert 0.0 <= by_type[SignalType.COG] < 360.0
        assert 0.0 <= by_type[SignalType.WIND_ANGLE] < 360.0
        assert 8.0 <= by_type[SignalType.WIND_SPEED] <= 16.0
        assert 24.0 <= by_type[SignalType.LATITUDE] <= 27.0
        assert -81.0 <= by_type[SignalType.LONGITUDE] <= -79.0


def test_sample_is_deterministic():
    sim = SimulatorSource()
    a = {s.type: s.value for s in sim.sample(42.0)}
    b = {s.type: s.value for s in sim.sample(42.0)}
    assert a == b
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_simulator.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'marex.sources.simulator'`.

- [ ] **Step 3: Write minimal implementation**

`backend/marex/sources/simulator.py`:
```python
from __future__ import annotations

import math
import time
from collections.abc import Iterator
from datetime import datetime, timezone

from marex.signals import Signal, SignalType
from marex.sources.base import DataSource

# Bahia ficticia (Miami) como punto base de la simulacion.
BASE_LAT = 25.7617
BASE_LON = -80.1918


class SimulatorSource(DataSource):
    def __init__(self, interval: float = 1.0) -> None:
        self.interval = interval

    def sample(self, elapsed: float) -> list[Signal]:
        ts = datetime.now(timezone.utc)
        depth = 15.0 + 5.0 * math.sin(elapsed / 30.0)        # 10..20 m
        sog = 6.0 + 2.0 * math.sin(elapsed / 20.0)           # 4..8 kn
        cog = (elapsed * 2.0) % 360.0
        lat = BASE_LAT + 0.0005 * math.sin(elapsed / 60.0)
        lon = BASE_LON + 0.0005 * math.cos(elapsed / 60.0)
        wind_speed = 12.0 + 4.0 * math.sin(elapsed / 45.0)   # 8..16 kn
        wind_angle = (elapsed * 1.5) % 360.0
        return [
            Signal.create(SignalType.DEPTH, depth, ts),
            Signal.create(SignalType.SOG, sog, ts),
            Signal.create(SignalType.COG, cog, ts),
            Signal.create(SignalType.LATITUDE, lat, ts),
            Signal.create(SignalType.LONGITUDE, lon, ts),
            Signal.create(SignalType.WIND_SPEED, wind_speed, ts),
            Signal.create(SignalType.WIND_ANGLE, wind_angle, ts),
        ]

    def stream(self) -> Iterator[list[Signal]]:
        start = time.monotonic()
        while True:
            yield self.sample(time.monotonic() - start)
            time.sleep(self.interval)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_simulator.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/marex/sources/simulator.py backend/tests/test_simulator.py
git commit -m "feat(backend): add SimulatorSource.sample with realistic ranges"
```

---

## Task 4: SimulatorSource.stream (timed generator)

**Files:**
- Modify: `backend/tests/test_simulator.py` (agregar test del stream)

- [ ] **Step 1: Write the failing test**

Agregar al final de `backend/tests/test_simulator.py`:
```python
import itertools


def test_stream_yields_ticks_without_real_sleep(monkeypatch):
    monkeypatch.setattr("marex.sources.simulator.time.sleep", lambda _: None)
    sim = SimulatorSource(interval=0.0)
    ticks = list(itertools.islice(sim.stream(), 3))
    assert len(ticks) == 3
    assert all(len(tick) == len(set(SignalType)) for tick in ticks)
```

- [ ] **Step 2: Run test to verify it fails (or passes if stream already correct)**

Run: `pytest tests/test_simulator.py::test_stream_yields_ticks_without_real_sleep -v`
Expected: PASS (la implementación de `stream` ya existe de la Task 3). Si falla, revisar que el `monkeypatch` apunte a `marex.sources.simulator.time.sleep`.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_simulator.py
git commit -m "test(backend): cover SimulatorSource.stream with mocked sleep"
```

---

## Task 5: SignalStore (SQLite time-series)

**Files:**
- Create: `backend/marex/storage.py`
- Test: `backend/tests/test_storage.py`

- [ ] **Step 1: Write the failing test**

`backend/tests/test_storage.py`:
```python
from datetime import datetime, timedelta, timezone

from marex.signals import Signal, SignalType
from marex.storage import SignalStore


def _store():
    return SignalStore(":memory:")


def test_append_and_latest_returns_most_recent():
    store = _store()
    t1 = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 1, 1, 12, 0, 1, tzinfo=timezone.utc)
    store.append(Signal.create(SignalType.DEPTH, 10.0, t1))
    store.append(Signal.create(SignalType.DEPTH, 11.0, t2))
    latest = store.latest(SignalType.DEPTH)
    assert latest is not None
    assert latest.value == 11.0
    assert latest.unit == "m"


def test_latest_returns_none_when_empty():
    assert _store().latest(SignalType.SOG) is None


def test_append_many_and_history_filters_by_type_and_time():
    store = _store()
    base = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    store.append_many(
        Signal.create(SignalType.DEPTH, float(i), base + timedelta(seconds=i))
        for i in range(5)
    )
    store.append(Signal.create(SignalType.SOG, 99.0, base))  # otro tipo, se excluye
    rows = store.history(SignalType.DEPTH, base, base + timedelta(seconds=2))
    assert [r.value for r in rows] == [0.0, 1.0, 2.0]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_storage.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'marex.storage'`.

- [ ] **Step 3: Write minimal implementation**

`backend/marex/storage.py`:
```python
from __future__ import annotations

import sqlite3
from collections.abc import Iterable
from datetime import datetime

from marex.signals import Signal, SignalType


class SignalStore:
    def __init__(self, db_path: str = ":memory:") -> None:
        self._conn = sqlite3.connect(db_path)
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS signals (
                type TEXT NOT NULL,
                value REAL NOT NULL,
                timestamp TEXT NOT NULL,
                unit TEXT NOT NULL
            )
            """
        )
        self._conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_type_ts ON signals(type, timestamp)"
        )
        self._conn.commit()

    def append(self, signal: Signal) -> None:
        self._conn.execute(
            "INSERT INTO signals (type, value, timestamp, unit) VALUES (?, ?, ?, ?)",
            (
                signal.type.value,
                signal.value,
                signal.timestamp.isoformat(),
                signal.unit,
            ),
        )
        self._conn.commit()

    def append_many(self, signals: Iterable[Signal]) -> None:
        for signal in signals:
            self.append(signal)

    def latest(self, type: SignalType) -> Signal | None:
        row = self._conn.execute(
            "SELECT type, value, timestamp, unit FROM signals "
            "WHERE type = ? ORDER BY timestamp DESC LIMIT 1",
            (type.value,),
        ).fetchone()
        return self._row_to_signal(row) if row else None

    def history(
        self, type: SignalType, since: datetime, until: datetime
    ) -> list[Signal]:
        rows = self._conn.execute(
            "SELECT type, value, timestamp, unit FROM signals "
            "WHERE type = ? AND timestamp >= ? AND timestamp <= ? "
            "ORDER BY timestamp ASC",
            (type.value, since.isoformat(), until.isoformat()),
        ).fetchall()
        return [self._row_to_signal(row) for row in rows]

    def close(self) -> None:
        self._conn.close()

    @staticmethod
    def _row_to_signal(row: tuple) -> Signal:
        type_str, value, ts, unit = row
        return Signal(
            type=SignalType(type_str),
            value=value,
            timestamp=datetime.fromisoformat(ts),
            unit=unit,
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_storage.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/marex/storage.py backend/tests/test_storage.py
git commit -m "feat(backend): add SQLite SignalStore (append/latest/history)"
```

---

## Task 6: Demo wiring + full verification

**Files:**
- Create: `backend/marex/demo.py`

- [ ] **Step 1: Write the demo script**

`backend/marex/demo.py`:
```python
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
```

- [ ] **Step 2: Run the full test suite**

Run (desde `backend/`): `pytest -v`
Expected: todos los tests pasan (signals, base_source, simulator x4, storage x3).

- [ ] **Step 3: Run the demo manually**

Run (desde `backend/`): `python -m marex.demo`
Expected: imprime 5 líneas con `depth=...` y `sog=...` cambiando, y crea `marex.db` (ignorado por git). Esta es la verificación end-to-end de los cimientos.

- [ ] **Step 4: Commit and push**

```bash
git add backend/marex/demo.py
git commit -m "feat(backend): add demo wiring simulator -> store"
git push
```

---

## Verification

- **Unit tests:** `cd backend && pytest -v` → todos verdes. Cubren el modelo de señales, la interfaz de fuente, el simulador (valores en rango, determinismo, stream sin sleep real) y el almacenamiento (latest, vacío, history filtrado).
- **End-to-end manual:** `python -m marex.demo` imprime valores en vivo del simulador persistidos y leídos desde SQLite.
- **Resultado:** una base de backend funcional y testeada sobre la que se montan los siguientes planes.

## Next plans (no incluidos aquí)

1. **Motor de alertas** — reglas (profundidad baja, batería baja, combustible insuficiente, anchor drag, geofence) sobre el flujo de señales.
2. **API FastAPI** — REST (estado/histórico/config) + WebSocket (tiempo real + push de alertas).
3. **Servicio conversacional** — LLM local (Llama 3.1 8B) con acceso a `SignalStore`.
4. **App React Native + Expo** — dashboard + chat + alertas contra la API.
