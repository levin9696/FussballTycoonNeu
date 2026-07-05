import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameStore, UPGRADES, MATCHDAY_UPGRADES, formatGeld, getUpgradeMultiplikator, getUpgradeStufenProgress } from '../store/gameStore';
import { LIGEN_ORDNUNG } from '../utils/ligaSystem';

export default function UpgradeScreen() {
  const { geld, aktuelleLigaIndex, upgrades, matchdayUpgrades, buyUpgrade, buyMaxUpgrade, buyMatchdayUpgrade } = useGameStore();
  const [tab, setTab] = useState<'passiv' | 'spieltag'>('passiv');

  const renderUpgradeCard = (
    id: string, name: string, basePrice: number, growth: number, minLigaIndex: number, count: number,
    bonusLabel: (multi: number, count: number) => string, onBuy: () => void, onBuyMax?: () => void
  ) => {
    const gesperrt = aktuelleLigaIndex < minLigaIndex;
    const cost = Math.floor(basePrice * Math.pow(growth, count));
    const leistbar = geld >= cost && !gesperrt;
    const multi = getUpgradeMultiplikator(count);
    const progress = getUpgradeStufenProgress(count);
    const fortschrittProzent = (progress.inStufe / progress.benoetigt) * 100;

    return (
      <View key={id} style={[styles.upgradeCard, (gesperrt || !leistbar) && styles.upgradeCardLocked]}>
        <View style={styles.upgradeTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.upgradeName}>{name}</Text>
            {gesperrt ? (
              <Text style={styles.lockedHint}>🔒 Freigeschaltet ab {LIGEN_ORDNUNG[minLigaIndex]}</Text>
            ) : (
              <>
                <Text style={styles.upgradeLevel}>Level {count} {multi > 1 ? `· x${multi} Bonus` : ''}</Text>
                <Text style={styles.upgradeBonus}>{bonusLabel(multi, count)}</Text>
              </>
            )}
          </View>
          {!gesperrt && (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TouchableOpacity style={[styles.buyButton, !leistbar && styles.buyButtonDisabled]} onPress={onBuy} disabled={!leistbar}>
                <Text style={styles.buyButtonText}>{formatGeld(cost)}</Text>
              </TouchableOpacity>
              {onBuyMax && <TouchableOpacity style={styles.maxButton} onPress={onBuyMax}><Text style={styles.maxButtonText}>Max</Text></TouchableOpacity>}
            </View>
          )}
        </View>
        {!gesperrt && (
          <View style={styles.stufeBarWrap}>
            <View style={styles.stufeBarContainer}><View style={[styles.stufeBarFill, { width: `${fortschrittProzent}%` }]} /></View>
            <Text style={styles.stufeBarLabel}>{progress.inStufe}/{progress.benoetigt} bis nächste Verdopplung</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#020617' }} contentContainerStyle={{ padding: 15 }}>
      <Text style={styles.screenTitle}>🏟️ Upgrade Shop</Text>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'passiv' && styles.tabBtnActive]} onPress={() => setTab('passiv')}><Text style={[styles.tabBtnText, tab === 'passiv' && styles.tabBtnTextActive]}>💰 Passiv</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'spieltag' && styles.tabBtnActive]} onPress={() => setTab('spieltag')}><Text style={[styles.tabBtnText, tab === 'spieltag' && styles.tabBtnTextActive]}>🏟️ Spieltag</Text></TouchableOpacity>
      </View>

      {tab === 'passiv' ? (
        UPGRADES.map((u) => {
          const count = upgrades[u.id] || 0;
          return renderUpgradeCard(u.id, u.name, u.basePrice, u.growth, u.minLigaIndex, count,
            (multi, c) => `+${(u.bonus * multi).toFixed(2)} €/s pro Stufe · aktiv ${formatGeld(c * u.bonus * multi)}/s`,
            () => buyUpgrade(u.id), () => buyMaxUpgrade(u.id));
        })
      ) : (
        <>
          <Text style={styles.hintText}>Zahlen sich nur bei Heimspielen aus, abhängig von deinem Hype-Wert (siehe "Verein"-Tab).</Text>
          {MATCHDAY_UPGRADES.map((u) => {
            const count = matchdayUpgrades[u.id] || 0;
            const einheit = u.type === 'kapazitaet' ? 'Plätze' : '€/Zuschauer';
            return renderUpgradeCard(u.id, u.name, u.basePrice, u.growth, u.minLigaIndex, count,
              (multi, c) => `+${(u.wert * multi).toFixed(2)} ${einheit} pro Stufe · aktiv ${(c * u.wert * multi).toLocaleString('de-DE', { maximumFractionDigits: 1 })} ${einheit}`,
              () => buyMatchdayUpgrade(u.id));
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 16, textAlign: 'center' },
  tabBar: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tabBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#f0b90b' },
  tabBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  tabBtnTextActive: { color: '#000' },
  hintText: { color: '#64748b', fontSize: 12, fontWeight: '600', marginBottom: 14, lineHeight: 17 },
  upgradeCard: { backgroundColor: '#1e293b', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  upgradeCardLocked: { opacity: 0.55 },
  upgradeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upgradeName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  upgradeLevel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 1 },
  upgradeBonus: { color: '#38bdf8', fontSize: 12, fontWeight: '600', marginTop: 3 },
  lockedHint: { color: '#f0b90b', fontSize: 12, fontWeight: '700', marginTop: 4 },
  buyButton: { backgroundColor: '#22c55e', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, minWidth: 80, alignItems: 'center' },
  buyButtonDisabled: { backgroundColor: '#334155' },
  buyButtonText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  maxButton: { backgroundColor: '#475569', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10 },
  maxButtonText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  stufeBarWrap: { marginTop: 10 },
  stufeBarContainer: { height: 6, backgroundColor: '#0f172a', borderRadius: 3, overflow: 'hidden' },
  stufeBarFill: { height: '100%', backgroundColor: '#f0b90b' },
  stufeBarLabel: { color: '#64748b', fontSize: 10, fontWeight: '600', marginTop: 4 },
});