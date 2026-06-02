import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from './src/theme';
import { SettingsProvider } from './src/SettingsContext';
import { TabBar, TabKey } from './src/components/TabBar';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

export default function App() {
  const [tab, setTab] = useState<TabKey>('panel');

  return (
    <SettingsProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.body}>
          {tab === 'panel' && <DashboardScreen />}
          {tab === 'alertas' && <AlertsScreen />}
          {tab === 'ia' && <ChatScreen />}
          {tab === 'ajustes' && <SettingsScreen />}
        </View>
        <TabBar active={tab} onNav={setTab} />
      </SafeAreaView>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  body: { flex: 1 },
});
