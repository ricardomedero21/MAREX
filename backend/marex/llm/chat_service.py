from __future__ import annotations

from marex.llm.base import LLM, LLMUnavailable, Message
from marex.llm.context import build_boat_context
from marex.storage import SignalStore

# Personalidad de Marex: capitán profesional, español, prioriza seguridad.
SYSTEM_PROMPT = """\
Eres Marex, un asistente de inteligencia artificial de a bordo: el capitán \
virtual de la embarcación. Hablas siempre en español, de forma breve, clara y \
profesional, y tratas al usuario de "capitán".

Reglas:
- Prioriza siempre la seguridad de la navegación.
- Usa los datos reales del barco que se te entregan abajo para responder. \
Cuando des una cifra, usa la del estado actual.
- Si te preguntan por un dato que no aparece en el estado del barco (por \
ejemplo combustible, baterías o temperatura del motor), aclara que ese sensor \
llegará en una próxima fase y que aún no tienes esa lectura.
- No inventes datos. Si no sabes algo, dilo con franqueza.
- Usa términos náuticos correctos, pero explícalos si pueden no entenderse.

{boat_context}
"""

# Respuesta de respaldo si el motor de IA local no está disponible.
FALLBACK_REPLY = (
    "Capitán, ahora mismo no puedo acceder a mi asistente de a bordo. "
    "Verifique que el motor de IA local (Ollama) esté en marcha e intente de nuevo."
)


class ChatService:
    """Orquesta la conversación: arma el prompt con el contexto del barco,
    mantiene el historial y consulta al LLM.
    """

    def __init__(self, llm: LLM, store: SignalStore, max_history: int = 20) -> None:
        self._llm = llm
        self._store = store
        self._max_history = max_history
        self._history: list[Message] = []

    @property
    def history(self) -> list[Message]:
        return list(self._history)

    def send(self, user_message: str) -> str:
        """Envía un mensaje del usuario y devuelve la respuesta de Marex."""
        self._history.append(Message("user", user_message))
        system = SYSTEM_PROMPT.format(boat_context=build_boat_context(self._store))
        try:
            reply = self._llm.complete(system, self._history)
        except LLMUnavailable:
            # No guardamos la respuesta de respaldo en el historial real.
            return FALLBACK_REPLY
        self._history.append(Message("assistant", reply))
        self._trim()
        return reply

    def reset(self) -> None:
        self._history.clear()

    def _trim(self) -> None:
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history :]
