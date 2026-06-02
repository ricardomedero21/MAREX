import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Saira_200ExtraLight,
  Saira_300Light,
  Saira_500Medium,
  Saira_600SemiBold,
} from '@expo-google-fonts/saira';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { theme } from './src/theme';
import { SettingsProvider } from './src/SettingsContext';
import { ScreenBackground } from './src/components/Screen';
import { TabBar, TabKey } from './src/components/TabBar';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

export default function App() {
  const [tab, setTab] = useState<TabKey>('panel');
  const [fontsLoaded] = useFonts({
    Saira_200ExtraLight,
    Saira_300Light,
    Saira_500Medium,
    Saira_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  return (
    <SettingsProvider>
      <View style={styles.root}>
        <ScreenBackground />
        <SafeAreaView style={styles.safe}>
          <StatusBar style="light" />
          {fontsLoaded ? (
            <>
              <View style={styles.body}>
                {tab === 'panel' && <DashboardScreen />}
                {tab === 'alertas' && <AlertsScreen />}
                {tab === 'ia' && <ChatScreen />}
                {tab === 'ajustes' && <SettingsScreen />}
              </View>
              <TabBar active={tab} onNav={setTab} />
            </>
          ) : null}
        </SafeAreaView>
      </View>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  safe: { flex: 1 },
  body: { flex: 1 },
});
