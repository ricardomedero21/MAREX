from __future__ import annotations

from marex.signals import SignalType
from marex.storage import SignalStore
from marex.format import cardinal

# Etiquetas legibles para cada señal en el contexto que ve el modelo.
_LABELS: dict[SignalType, str] = {
    SignalType.DEPTH: "Profundidad",
    SignalType.SOG: "Velocidad (SOG)",
    SignalType.COG: "Rumbo (COG)",
    SignalType.WIND_SPEED: "Viento",
    SignalType.WIND_ANGLE: "Dirección del viento",
    SignalType.LATITUDE: "Latitud",
    SignalType.LONGITUDE: "Longitud",
}


def build_boat_context(store: SignalStore) -> str:
    """Lee el último valor de cada señal y lo formatea como texto para el modelo.

    Devuelve un bloque legible que se inyecta en el system prompt para que
    Marex responda con los datos reales del barco.
    """
    lines: list[str] = ["Estado actual del barco:"]

    depth = store.latest(SignalType.DEPTH)
    if depth is not None:
        lines.append(f"- Profundidad: {depth.value:.1f} m")

    sog = store.latest(SignalType.SOG)
    if sog is not None:
        lines.append(f"- Velocidad sobre el fondo: {sog.value:.1f} nudos")

    cog = store.latest(SignalType.COG)
    if cog is not None:
        lines.append(f"- Rumbo: {cog.value:.0f}° ({cardinal(cog.value)})")

    wind_speed = store.latest(SignalType.WIND_SPEED)
    wind_angle = store.latest(SignalType.WIND_ANGLE)
    if wind_speed is not None and wind_angle is not None:
        lines.append(
            f"- Viento: {wind_speed.value:.0f} nudos desde {wind_angle.value:.0f}° "
            f"({cardinal(wind_angle.value)})"
        )

    lat = store.latest(SignalType.LATITUDE)
    lon = store.latest(SignalType.LONGITUDE)
    if lat is not None and lon is not None:
        ns = "N" if lat.value >= 0 else "S"
        ew = "E" if lon.value >= 0 else "O"
        lines.append(
            f"- Posición: {abs(lat.value):.4f}° {ns}, {abs(lon.value):.4f}° {ew}"
        )

    if len(lines) == 1:
        lines.append("- (sin datos disponibles en este momento)")

    return "\n".join(lines)
