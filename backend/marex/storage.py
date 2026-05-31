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
