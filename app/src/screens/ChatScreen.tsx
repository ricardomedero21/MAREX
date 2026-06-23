import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../theme';
import { sample } from '../simulator';
import { useSettings } from '../SettingsContext';
import { useChat } from '../ChatContext';
import { cardinal, formatDepth, formatLat, formatLon } from '../format';
import { sendChat } from '../api';
import { Header } from '../components/Header';
import { LivePill } from '../components/Badges';
import { MarexMark } from '../components/MarexMark';
import { Ic } from '../components/icons';
import { ChatList } from '../components/ChatList';

// Respondedor local de respaldo: solo se usa si el backend no responde.
function localReply(question: string, depthUnit: 'm' | 'ft'): string {
  const q = question.toLowerCase();
  const now = sample((Date.now() / 1000) % 100000);
  if (/(profund|sonda|cala)/.test(q)) return `Profundidad actual: ${formatDepth(now.depth, depthUnit)}.`;
  if (/(velocid|nudo|rapid)/.test(q)) return `Vas a ${now.sog.toFixed(1)} nudos sobre el fondo.`;
  if (/(rumbo|cog|direcc)/.test(q)) return `Rumbo ${Math.round(now.cog)}° (${cardinal(now.cog)}).`;
  if (/(viento|wind)/.test(q)) return `Viento de ${now.windSpeed.toFixed(1)} kn desde ${Math.round(now.windAngle)}° (${cardinal(now.windAngle)}).`;
  if (/(posic|donde|dónde|ubica|gps|coorden)/.test(q)) return `Posición:\n${formatLat(now.lat)}\n${formatLon(now.lon)}.`;
  return 'Sin conexión con el cerebro de a bordo. Verifica que el servidor de Marex esté encendido (Ajustes › Servidor).';
}

export function ChatScreen() {
  const { depthUnit, serverUrl } = useSettings();
  const { active, appendMessage, nextMsgId, draft, setDraft } = useChat();
  const [busy, setBusy] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const messages = active.messages;

  async function send() {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    appendMessage({ id: nextMsgId(), from: 'user', text: trimmed });
    setDraft('');
    setBusy(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    let replyText: string;
    try {
      replyText = await sendChat(serverUrl, trimmed);
    } catch {
      replyText = localReply(trimmed, depthUnit);
    }
    appendMessage({ id: nextMsgId(), from: 'marex', text: replyText });
    setBusy(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header
        showLogo
        sub="ASISTENTE NÁUTICO"
        title="Marex IA"
        right={
          <View style={styles.headerBtns}>
            <Pressable style={styles.headerBtn} onPress={() => setListOpen((v) => !v)}>
              <Ic.compass size={20} color={listOpen ? theme.colors.accent : theme.colors.textMuted} />
            </Pressable>
          </View>
        }
      />
      {listOpen ? <ChatList onClose={() => setListOpen(false)} /> : null}
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.messages}>
        {messages.map((m) => {
          const me = m.from === 'user';
          return (
            <View key={m.id} style={{ alignItems: me ? 'flex-end' : 'flex-start', gap: 6 }}>
              {!me ? (
                <View style={styles.iaTag}>
                  <MarexMark size={17} />
                  <Text style={styles.iaTagText}>MAREX IA</Text>
                </View>
              ) : null}
              <View style={[styles.bubble, me ? styles.user : styles.marex]}>
                <Text style={me ? styles.userText : styles.marexText}>{m.text}</Text>
              </View>
            </View>
          );
        })}
        {busy ? (
          <View style={{ alignItems: 'flex-start', gap: 6 }}>
            <View style={styles.iaTag}>
              <MarexMark size={17} />
              <Text style={styles.iaTagText}>MAREX IA</Text>
            </View>
            <View style={[styles.bubble, styles.marex]}>
              <Text style={[styles.marexText, { color: theme.colors.textMuted }]}>escribiendo…</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Pregunta a Marex…"
          placeholderTextColor={theme.colors.textMuted}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable style={styles.sendBtn} onPress={send}>
          <Ic.send size={19} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 0.5,
    borderColor: theme.colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: { padding: 18, paddingBottom: 24, gap: 16 },
  iaTag: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 4 },
  iaTagText: { fontSize: 10.5, fontFamily: theme.font.label, letterSpacing: 1.2, color: theme.colors.accent },
  bubble: { maxWidth: '80%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 18 },
  user: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 6 },
  marex: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 0.5,
    borderColor: theme.colors.hairline,
    borderBottomLeftRadius: 6,
  },
  userText: { color: '#fff', fontSize: 14.5, fontFamily: theme.font.displayMed, lineHeight: 22 },
  marexText: { color: theme.colors.text, fontSize: 14.5, fontFamily: theme.font.displayLight, lineHeight: 22 },
  composer: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 110, // espacio sobre la tab bar flotante
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 26,
    borderWidth: 0.5,
    borderColor: theme.colors.hairlineStrong,
    color: theme.colors.text,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14.5,
    fontFamily: theme.font.displayLight,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
});
