from datetime import datetime, timezone

from marex.alerts.engine import AlertEngine
from marex.alerts.geo import haversine
from marex.alerts.models import (
    AlertConfig,
    AlertKey,
    AlertState,
    AnchorConfig,
    GeofenceConfig,
    GeoPoint,
)
from marex.alerts.rules import (
    anchor_rule,
    battery_rule,
    depth_rule,
    fuel_rule,
    geofence_rule,
)
from marex.signals import Signal, SignalType
from marex.storage import SignalStore

TS = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)


def _store(**values) -> SignalStore:
    store = SignalStore(":memory:")
    for t, v in values.items():
        store.append(Signal.create(t, v, TS))
    return store


def _by_key(alerts):
    return {a.key: a for a in alerts}


# ---- haversine ----

def test_haversine_zero_distance():
    assert haversine(25.0, -80.0, 25.0, -80.0) == 0.0


def test_haversine_known_distance():
    # ~111 km por grado de latitud en el ecuador (tolerancia 1%).
    d = haversine(0.0, 0.0, 1.0, 0.0)
    assert abs(d - 111_195) < 1_200


# ---- profundidad ----

def test_depth_danger_below_threshold():
    a = depth_rule(_store(**{SignalType.DEPTH: 2.0}), AlertConfig(depth_min=3.0))
    assert a.state is AlertState.DANGER


def test_depth_warn_near_threshold():
    a = depth_rule(_store(**{SignalType.DEPTH: 4.0}), AlertConfig(depth_min=3.0, depth_margin=2.0))
    assert a.state is AlertState.WARN


def test_depth_ok_when_deep():
    a = depth_rule(_store(**{SignalType.DEPTH: 15.0}), AlertConfig(depth_min=3.0))
    assert a.state is AlertState.OK


def test_depth_nodata_when_missing():
    a = depth_rule(_store(), AlertConfig())
    assert a.state is AlertState.NODATA


# ---- batería y combustible ----

def test_battery_danger_low_voltage():
    a = battery_rule(_store(**{SignalType.BATTERY: 11.5}), AlertConfig(battery_min=11.8))
    assert a.state is AlertState.DANGER


def test_fuel_warn_then_danger():
    cfg = AlertConfig(fuel_min=15.0, fuel_warn=25.0)
    assert fuel_rule(_store(**{SignalType.FUEL: 20.0}), cfg).state is AlertState.WARN
    assert fuel_rule(_store(**{SignalType.FUEL: 10.0}), cfg).state is AlertState.DANGER
    assert fuel_rule(_store(**{SignalType.FUEL: 80.0}), cfg).state is AlertState.OK


# ---- anchor drag ----

def test_anchor_ok_when_no_anchor_set():
    a = anchor_rule(_store(**{SignalType.LATITUDE: 25.0, SignalType.LONGITUDE: -80.0}), AlertConfig())
    assert a.state is AlertState.OK


def test_anchor_danger_when_drifted():
    cfg = AlertConfig(anchor=AnchorConfig(point=GeoPoint(25.0, -80.0), tolerance_m=30.0))
    # ~111 m al norte (0.001 grados de latitud) supera la tolerancia de 30 m.
    store = _store(**{SignalType.LATITUDE: 25.001, SignalType.LONGITUDE: -80.0})
    assert anchor_rule(store, cfg).state is AlertState.DANGER


def test_anchor_ok_when_within_tolerance():
    cfg = AlertConfig(anchor=AnchorConfig(point=GeoPoint(25.0, -80.0), tolerance_m=30.0))
    store = _store(**{SignalType.LATITUDE: 25.00005, SignalType.LONGITUDE: -80.0})  # ~5.5 m
    assert anchor_rule(store, cfg).state is AlertState.OK


# ---- geofence ----

def test_geofence_danger_when_outside():
    cfg = AlertConfig(geofence=GeofenceConfig(center=GeoPoint(25.0, -80.0), radius_m=100.0))
    store = _store(**{SignalType.LATITUDE: 25.002, SignalType.LONGITUDE: -80.0})  # ~222 m
    assert geofence_rule(store, cfg).state is AlertState.DANGER


def test_geofence_ok_when_inside():
    cfg = AlertConfig(geofence=GeofenceConfig(center=GeoPoint(25.0, -80.0), radius_m=100.0))
    store = _store(**{SignalType.LATITUDE: 25.0005, SignalType.LONGITUDE: -80.0})  # ~55 m
    assert geofence_rule(store, cfg).state is AlertState.OK


# ---- engine ----

def test_engine_returns_all_five_rules():
    store = _store(**{
        SignalType.DEPTH: 15.0,
        SignalType.BATTERY: 12.5,
        SignalType.FUEL: 80.0,
        SignalType.LATITUDE: 25.0,
        SignalType.LONGITUDE: -80.0,
    })
    alerts = AlertEngine().evaluate(store)
    keys = {a.key for a in alerts}
    assert keys == set(AlertKey)


def test_engine_respects_disabled_rule():
    cfg = AlertConfig()
    cfg.enabled[AlertKey.GEOFENCE] = False
    alerts = AlertEngine(cfg).evaluate(_store(**{SignalType.DEPTH: 15.0}))
    assert AlertKey.GEOFENCE not in {a.key for a in alerts}


def test_engine_flags_danger_on_shallow_water():
    store = _store(**{SignalType.DEPTH: 1.0})
    by = _by_key(AlertEngine().evaluate(store))
    assert by[AlertKey.DEPTH].state is AlertState.DANGER
