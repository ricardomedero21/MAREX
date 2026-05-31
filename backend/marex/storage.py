from __future__ import annotations

import sqlite3
from collections.abc import Iterable
from datetime import datetime, timezone

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

    @staticmethod
    def _row_values(signal: Signal) -> tuple:
        if signal.timestamp.tzinfo is None:
            raise ValueError(
                f"Signal timestamp must be timezone-aware, got {signal.timestamp!r}"
            )
        return (
            signal.type.value,
            signal.value,
            signal.timestamp.isoformat(),
            signal.unit,
        )

    def append(self, signal: Signal) -> None:
        self._conn.execute(
            "INSERT INTO signals (type, value, timestamp, unit) VALUES (?, ?, ?, ?)",
            self._row_values(signal),
        )
        self._conn.commit()

    def append_many(self, signals: Iterable[Signal]) -> None:
        rows = [self._row_values(signal) for signal in signals]
        self._conn.executemany(
            "INSERT INTO signals (type, value, timestamp, unit) VALUES (?, ?, ?, ?)",
            rows,
        )
        self._conn.commit()

    def latest(self, signal_type: SignalType) -> Signal | None:
        row = self._conn.execute(
            "SELECT type, value, timestamp, unit FROM signals "
            "WHERE type = ? ORDER BY timestamp DESC LIMIT 1",
            (signal_type.value,),
        ).fetchone()
        return self._row_to_signal(row) if row else None

    def history(
        self, signal_type: SignalType, since: datetime, until: datetime
    ) -> list[Signal]:
        rows = self._conn.execute(
            "SELECT type, value, timestamp, unit FROM signals "
            "WHERE type = ? AND timestamp >= ? AND timestamp <= ? "
            "ORDER BY timestamp ASC",
            (signal_type.value, since.isoformat(), until.isoformat()),
        ).fetchall()
        return [self._row_to_signal(row) for row in rows]

    def close(self) -> None:
        self._conn.close()

    def __enter__(self) -> "SignalStore":
        return self

    def __exit__(self, *_) -> None:
        self.close()

    @staticmethod
    def _row_to_signal(row: tuple) -> Signal:
        type_str, value, ts, unit = row
        timestamp = datetime.fromisoformat(ts)
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        return Signal(
            type=SignalType(type_str),
            value=value,
            timestamp=timestamp,
            unit=unit,
        )
