import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function HomeScreen() {
  const { klickBall, klickPower, klickCount } = useGameStore();
  
  // Zeige Fortschritt zu den nächsten 50 Klicks
  const progress = (klickCount % 50) / 50;

  return (
    <View style={styles.container}>
      <Text style={styles.powerText}>Klick-Stärke: {klickPower} €</Text>
      
      <TouchableOpacity style={styles.ball} onPress={klickBall}>
        <Text style={{fontSize: 50}}>⚽</Text>
      </TouchableOpacity>

      {/* DER FORTSCHRITTSBALKEN */}
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.hint}>Klicke für Fortschritt: {klickCount % 50}/50</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  powerText: { color: '#fff', fontSize: 18, marginBottom: 20 },
  ball: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  barContainer: { width: '80%', height: 10, backgroundColor: '#334155', borderRadius: 5, marginTop: 20, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#22c55e' },
  hint: { color: '#94a3b8', marginTop: 10 }
});