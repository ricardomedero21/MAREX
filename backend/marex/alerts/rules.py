from __future__ import annotations

from marex.alerts.geo import haversine
from marex.alerts.models import (
    Alert,
    AlertConfig,
    AlertKey,
    AlertState,
)
from marex.signals import SignalType
from marex.storage import SignalStore


def _value(store: SignalStore, t: SignalType) -> float | None:
    sig = store.latest(t)
    return sig.value if sig is not None else None


def depth_rule(store: SignalStore, cfg: AlertConfig) -> Alert:
    depth = _value(store, SignalType.DEPTH)
    if depth is None:
        return Alert(AlertKey.DEPTH, AlertState.NODATA, "Profundidad baja", "Sin lectura de sonda.")
    if depth < cfg.depth_min:
        return Alert(
            AlertKey.DEPTH, AlertState.DANGER, "Profundidad baja",
            f"Profundidad {depth:.1f} m bajo el umbral de {cfg.depth_min:.1f} m. Riesgo de encallar.",
        )
    if depth < cfg.depth_min + cfg.depth_margin:
        return Alert(
            AlertKey.DEPTH, AlertState.WARN, "Profundidad baja",
            f"Profundidad {depth:.1f} m, cerca del umbral de {cfg.depth_min:.1f} m.",
        )
    return Alert(AlertKey.DEPTH, AlertState.OK, "Profundidad", f"Profundidad {depth:.1f} m.")


def battery_rule(store: SignalStore, cfg: AlertConfig) -> Alert:
    v = _value(store, SignalType.BATTERY)
    if v is None:
        return Alert(AlertKey.BATTERY, AlertState.NODATA, "Batería baja", "Sin lectura de batería.")
    if v < cfg.battery_min:
        return Alert(
            AlertKey.BATTERY, AlertState.DANGER, "Batería baja",
            f"Voltaje {v:.1f} V bajo el mínimo de {cfg.battery_min:.1f} V.",
        )
    return Alert(AlertKey.BATTERY, AlertState.OK, "Batería", f"Voltaje {v:.1f} V.")


def fuel_rule(store: SignalStore, cfg: AlertConfig) -> Alert:
    f = _value(store, SignalType.FUEL)
    if f is None:
        return Alert(AlertKey.FUEL, AlertState.NODATA, "Combustible insuficiente", "Sin lectura de combustible.")
    if f < cfg.fuel_min:
        return Alert(
            AlertKey.FUEL, AlertState.DANGER, "Combustible insuficiente",
            f"Combustible {f:.0f} % bajo el mínimo de {cfg.fuel_min:.0f} %.",
        )
    if f < cfg.fuel_warn:
        return Alert(
            AlertKey.FUEL, AlertState.WARN, "Combustible insuficiente",
            f"Combustible {f:.0f} %, conviene repostar pronto.",
        )
    return Alert(AlertKey.FUEL, AlertState.OK, "Combustible", f"Combustible {f:.0f} %.")


def anchor_rule(store: SignalStore, cfg: AlertConfig) -> Alert:
    if cfg.anchor is None:
        return Alert(AlertKey.ANCHOR, AlertState.OK, "Garreo del fondeo", "Sin fondeo activo.")
    lat = _value(store, SignalType.LATITUDE)
    lon = _value(store, SignalType.LONGITUDE)
    if lat is None or lon is None:
        return Alert(AlertKey.ANCHOR, AlertState.NODATA, "Garreo del fondeo", "Sin posición GPS.")
    dist = haversine(lat, lon, cfg.anchor.point.lat, cfg.anchor.point.lon)
    if dist > cfg.anchor.tolerance_m:
        return Alert(
            AlertKey.ANCHOR, AlertState.DANGER, "Garreo del fondeo",
            f"Deriva de {dist:.0f} m respecto al fondeo (máx {cfg.anchor.tolerance_m:.0f} m).",
        )
    return Alert(
        AlertKey.ANCHOR, AlertState.OK, "Garreo del fondeo",
        f"Fondeado firme · deriva {dist:.0f} m.",
    )


def geofence_rule(store: SignalStore, cfg: AlertConfig) -> Alert:
    if cfg.geofence is None:
        return Alert(AlertKey.GEOFENCE, AlertState.OK, "Salida de zona (geofence)", "Sin zona definida.")
    lat = _value(store, SignalType.LATITUDE)
    lon = _value(store, SignalType.LONGITUDE)
    if lat is None or lon is None:
        return Alert(AlertKey.GEOFENCE, AlertState.NODATA, "Salida de zona (geofence)", "Sin posición GPS.")
    dist = haversine(lat, lon, cfg.geofence.center.lat, cfg.geofence.center.lon)
    if dist > cfg.geofence.radius_m:
        return Alert(
            AlertKey.GEOFENCE, AlertState.DANGER, "Salida de zona (geofence)",
            f"Fuera de la zona por {dist - cfg.geofence.radius_m:.0f} m.",
        )
    return Alert(
        AlertKey.GEOFENCE, AlertState.OK, "Salida de zona (geofence)",
        f"Dentro de la zona · {dist:.0f} m del centro.",
    )


# Orden de evaluación de las reglas (también orden de visualización).
ALL_RULES = [depth_rule, battery_rule, fuel_rule, anchor_rule, geofence_rule]
