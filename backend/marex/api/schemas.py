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


class AlertOut(BaseModel):
    key: str
    state: str
    title: str
    detail: str


class AlertsOut(BaseModel):
    alerts: list[AlertOut]


class AlertConfigUpdate(BaseModel):
    depth_min: float | None = None
    battery_min: float | None = None
    fuel_min: float | None = None
    fuel_warn: float | None = None


class AnchorRequest(BaseModel):
    clear: bool = False
    tolerance_m: float = 30.0


class GeofenceRequest(BaseModel):
    clear: bool = False
    radius_m: float = 100.0


class ConfigOut(BaseModel):
    depth_min: float
    battery_min: float
    fuel_min: float
    fuel_warn: float
    anchor_set: bool
    geofence_set: bool
