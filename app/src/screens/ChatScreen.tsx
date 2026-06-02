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
import { cardinal, formatDepth, formatLat, formatLon } from '../format';
import { Header } from '../components/Header';
import { LivePill } from '../components/Badges';
import { MarexMark } from '../components/MarexMark';
import { Ic } from '../components/icons';

type Msg = { id: number; from: 'user' | 'marex'; text: string };

// Respondedor local provisional (sin LLM todavía). Cuando esté el backend,
// esto se reemplaza por el servicio conversacional (Llama 3.1 8B / Claude API).
function reply(question: string, depthUnit: 'm' | 'ft'): string {
  const q = question.toLowerCase();
  const now = sample((Date.now() / 1000) % 100000);
  if (/(profund|sonda|cala)/.test(q)) return `Profundidad actual: ${formatDepth(now.depth, depthUnit)}.`;
  if (/(velocid|nudo|rapid)/.test(q)) return `Vas a ${now.sog.toFixed(1)} nudos sobre el fondo.`;
  if (/(rumbo|cog|direcc)/.test(q)) return `Rumbo ${Math.round(now.cog)}° (${cardinal(now.cog)}).`;
  if (/(viento|wind)/.test(q)) return `Viento de ${now.windSpeed.toFixed(1)} kn desde ${Math.round(now.windAngle)}° (${cardinal(now.windAngle)}).`;
  if (/(posic|donde|dónde|ubica|gps|coorden)/.test(q)) return `Posición:\n${formatLat(now.lat)}\n${formatLon(now.lon)}.`;
  if (/(fonde|ancla|garr)/.test(q)) return 'No hay un fondeo activo. Cuando fondees podré vigilar el garreo del ancla.';
  if (/(hola|buenas|hey|capit)/.test(q)) return '¡Hola, capitán! Preguntame por la profundidad, velocidad, rumbo, viento o posición.';
  return 'Por ahora puedo responder sobre profundidad, velocidad, rumbo, viento y posición. (El asistente completo con IA llega en la próxima fase.)';
}

export function ChatScreen() {
  const { depthUnit } = useSettings();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, from: 'marex', text: 'Buenos días, capitán. Todo en orden. Preguntame por el estado del barco: profundidad, velocidad, rumbo, viento o posición.' },
  ]);
  const idRef = useRef(1);
  const scrollRef = useRef<ScrollView>(null);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { id: idRef.current++, from: 'user', text: trimmed };
    const marexMsg: Msg = { id: idRef.current++, from: 'marex', text: reply(trimmed, depthUnit) };
    setMessages((m) => [...m, userMsg, marexMsg]);
    setText('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header showLogo sub="ASISTENTE NÁUTICO" title="Marex IA" right={<LivePill label="A BORDO" color={theme.colors.accent} />} />
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
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
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
  messages: { padding: 18, paddingBottom: 130, gap: 16 },
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
  userText: { color: '#fff', fontSize: 14.5, fontFamily: theme.font.displayMed, lineHeight: 21 },
  marexText: { color: theme.colors.text, fontSize: 14.5, fontFamily: theme.font.displayLight, lineHeight: 21 },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
