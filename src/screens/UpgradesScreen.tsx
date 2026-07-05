import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
// Wir importieren den Store ganz normal
import { useGameStore, UPGRADES } from '../store/gameStore';

export default function UpgradeScreen() {
  // buyMaxUpgrade wurde hier oben hinzugefügt, damit es unten nicht mehr "undefined" ist!
  const { geld, upgrades, buyUpgrade, buyMaxUpgrade } = useGameStore();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upgrade Shop</Text>
      {UPGRADES.map((u) => {
        const count = upgrades[u.id] || 0;
        const cost = Math.floor(u.basePrice * Math.pow(1.15, count));
        const totalBonus = count * u.bonus;
        
        return (
          <View key={u.id} style={styles.upgradeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeName}>{u.name} (Lvl {count})</Text>
              <Text style={styles.upgradeInfo}>+{u.bonus} €/s pro Kauf</Text>
              <Text style={styles.upgradeInfo}>Gesamt: {totalBonus} €/s</Text>
              
              {/* Fortschrittsbalken für das nächste Level */}
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${(count % 10) * 10}%` }]} />
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <TouchableOpacity style={styles.buyButton} onPress={() => buyUpgrade(u.id)}>
                <Text style={styles.buyButtonText}>{cost} €</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.maxButton} onPress={() => buyMaxUpgrade(u.id)}>
                <Text style={styles.buyButtonText}>Max</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 15 },
  title: { color: '#ffffff', fontSize: 32, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  upgradeCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  upgradeName: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  upgradeInfo: { color: '#38bdf8', fontSize: 14, fontWeight: '600', marginTop: 5 },
  buyButton: { 
    backgroundColor: '#22c55e', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 15 
  },
  buyButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 16 },
  barContainer: { 
    height: 6, 
    backgroundColor: '#334155', 
    borderRadius: 3, 
    marginTop: 8, 
    width: '100%',
    overflow: 'hidden'
  },
  barFill: { 
    height: '100%', 
    backgroundColor: '#38bdf8' 
  },
  maxButton: { 
    backgroundColor: '#475569', 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    borderRadius: 15 
  },
});