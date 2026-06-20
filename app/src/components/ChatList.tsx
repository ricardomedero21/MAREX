import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { useChat } from '../ChatContext';
import { Ic } from './icons';

// Panel desplegable con la lista de conversaciones guardadas.
export function ChatList({ onClose }: { onClose: () => void }) {
  const { conversations, activeId, selectChat, startChat, deleteChat } = useChat();

  return (
    <View style={styles.panel}>
      <Pressable
        style={styles.newBtn}
        onPress={() => {
          startChat();
          onClose();
        }}
      >
        <Ic.plus size={18} color="#fff" />
        <Text style={styles.newText}>Nueva conversación</Text>
      </Pressable>

      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {conversations.map((c) => {
          const isActive = c.id === activeId;
          return (
            <Pressable
              key={c.id}
              style={[styles.row, isActive && styles.rowActive]}
              onPress={() => {
                selectChat(c.id);
                onClose();
              }}
            >
              <Ic.compass size={16} color={isActive ? theme.colors.accent : theme.colors.textMuted} />
              <Text style={[styles.title, isActive && { color: theme.colors.text }]} numberOfLines={1}>
                {c.title}
              </Text>
              <Pressable hitSlop={8} onPress={() => deleteChat(c.id)}>
                <Ic.minus size={16} color={theme.colors.textMuted} />
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: 18,
    marginBottom: 8,
    maxHeight: 260,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radiusSm,
    borderWidth: 0.5,
    borderColor: theme.colors.hairlineStrong,
    padding: 10,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  newText: { color: '#fff', fontFamily: theme.font.displayMed, fontSize: 14 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rowActive: { backgroundColor: theme.colors.surfaceHi },
  title: { flex: 1, color: theme.colors.textMuted, fontFamily: theme.font.displayLight, fontSize: 13.5 },
});
