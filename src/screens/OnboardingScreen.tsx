import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function OnboardingScreen() {
  const schliesseOnboardingAb = useGameStore((s) => s.schliesseOnboardingAb);
  const [name, setName] = useState('');

  const starten = () => {
    if (name.trim().length === 0) {
      alert('Bitte gib deinem Verein einen Namen!');
      return;
    }
    schliesseOnboardingAb(name);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.emoji}>⚽</Text>
      <Text style={styles.title}>Willkommen bei Club Manager!</Text>
      <Text style={styles.subtitle}>Wie soll dein Verein heißen?</Text>

      <TextInput
        style={styles.input}
        placeholder="z.B. FC Mustertown"
        placeholderTextColor="#64748b"
        value={name}
        onChangeText={setName}
        maxLength={24}
        autoFocus
      />

      <TouchableOpacity style={styles.button} onPress={starten}>
        <Text style={styles.buttonText}>🚀 Verein gründen</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', padding: 30 },
  emoji: { fontSize: 70, marginBottom: 10 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 15, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#f0b90b', borderRadius: 14, padding: 16, color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#22c55e', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});