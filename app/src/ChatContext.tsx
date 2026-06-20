import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatMsg = { id: number; from: 'user' | 'marex'; text: string };

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMsg[];
};

const STORAGE_KEY = 'marex.conversations.v1';

const WELCOME: ChatMsg = {
  id: 0,
  from: 'marex',
  text: 'Buenos días, capitán. Todo en orden. Preguntame por el estado del barco: profundidad, velocidad, rumbo, viento o posición.',
};

function newConversation(): Conversation {
  // id basado en tiempo + aleatorio: no usamos Date como dependencia de render.
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return { id, title: 'Nueva conversación', createdAt: Date.now(), messages: [WELCOME] };
}

type ChatCtx = {
  conversations: Conversation[];
  activeId: string;
  active: Conversation;
  loaded: boolean;
  selectChat: (id: string) => void;
  startChat: () => void;
  deleteChat: (id: string) => void;
  appendMessage: (msg: ChatMsg) => void;
  nextMsgId: () => number;
  draft: string;
  setDraft: (s: string) => void;
};

const Ctx = createContext<ChatCtx | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const msgCounter = useRef(1);

  // Cargar de almacenamiento local al inicio.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: Conversation[] = JSON.parse(raw);
          if (parsed.length > 0) {
            setConversations(parsed);
            setActiveId(parsed[0].id);
            const maxId = Math.max(0, ...parsed.flatMap((c) => c.messages.map((m) => m.id)));
            msgCounter.current = maxId + 1;
            setLoaded(true);
            return;
          }
        }
      } catch {
        // si falla la lectura, arrancamos limpio
      }
      const first = newConversation();
      setConversations([first]);
      setActiveId(first.id);
      setLoaded(true);
    })();
  }, []);

  // Persistir ante cualquier cambio (una vez cargado).
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)).catch(() => {});
  }, [conversations, loaded]);

  const active =
    conversations.find((c) => c.id === activeId) ?? conversations[0] ?? newConversation();

  function selectChat(id: string) {
    setActiveId(id);
    setDraft('');
  }

  function startChat() {
    const conv = newConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setDraft('');
  }

  function deleteChat(id: string) {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      const next = remaining.length > 0 ? remaining : [newConversation()];
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  function nextMsgId() {
    return msgCounter.current++;
  }

  function appendMessage(msg: ChatMsg) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        const messages = [...c.messages, msg];
        // El título se deriva del primer mensaje del usuario.
        const title =
          c.title === 'Nueva conversación' && msg.from === 'user'
            ? msg.text.slice(0, 40)
            : c.title;
        return { ...c, messages, title };
      }),
    );
  }

  return (
    <Ctx.Provider
      value={{
        conversations,
        activeId,
        active,
        loaded,
        selectChat,
        startChat,
        deleteChat,
        appendMessage,
        nextMsgId,
        draft,
        setDraft,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useChat(): ChatCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useChat debe usarse dentro de <ChatProvider>');
  return v;
}
