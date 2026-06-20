from __future__ import annotations

from pydantic import BaseModel


class SignalOut(BaseModel):
    type: str
    value: float
    unit: str
    timestamp: str


class StateOut(BaseModel):
    """Estado actual del barco: último valor de cada señal."""

    signals: list[SignalOut]


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
