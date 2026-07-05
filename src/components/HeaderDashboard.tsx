import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function HeaderDashboard() {
  const { geld, kader, aufstellung } = useGameStore();

  // Berechnet die Teamstärke der aktuellen Aufstellung absolut crash-sicher
  const teamStaerke = Object.values(aufstellung || {}).reduce((sum, player) => {
    return sum + (player ? player.rating : 0);
  }, 0);

  // Zählt die Anzahl der Spieler im Kader
  const spielerAnzahl = (kader || []).length;

  return (
    <View style={styles.headerContainer}>
      {/* Budget Anzeige */}
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>💰 BUDGET</Text>
        <Text style={styles.statValue}>{geld?.toLocaleString()} €</Text>
      </View>
      
      {/* Teamstärken Anzeige aus der Aufstellung */}
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>⭐ TEAM RAT.</Text>
        <Text style={styles.statValue}>{teamStaerke}</Text>
      </View>

      {/* Kader-Größen Anzeige */}
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>🏃 KADER</Text>
        <Text style={styles.statValue}>{spielerAnzahl}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    backgroundColor: '#111622',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#2d3748',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#4a5568',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
});