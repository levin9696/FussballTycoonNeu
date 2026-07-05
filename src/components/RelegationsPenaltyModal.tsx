import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useGameStore, ElfmeterRichtung } from '../store/gameStore';

interface Props { onFertig: () => void; }

const RICHTUNGEN: { key: ElfmeterRichtung; label: string; icon: string }[] = [
  { key: 'links', label: 'Links', icon: '⬅️' },
  { key: 'mitte', label: 'Mitte', icon: '⬆️' },
  { key: 'rechts', label: 'Rechts', icon: '➡️' },
];

export default function RelegationsPenaltyModal({ onFertig }: Props) {
  const { relegationsDuell, elfmeterAktion, vereinsName } = useGameStore();
  const [letzteAktion, setLetzteAktion] = useState<{ tor: boolean } | null>(null);
  const [warteAufAnimation, setWarteAufAnimation] = useState(false);

  if (!relegationsDuell || !relegationsDuell.elfmeterAktiv) return null;
  const duell = relegationsDuell;
  const schuetzeIstSpieler = duell.elfmeterAktuellSchuetzeIstSpieler;
  const promptText = duell.elfmeterAbgeschlossen ? null : schuetzeIstSpieler ? 'Wohin schießt du?' : 'Wohin hältst du?';

  const handlePress = (richtung: ElfmeterRichtung) => {
    if (warteAufAnimation || duell.elfmeterAbgeschlossen) return;
    setWarteAufAnimation(true);
    const result = elfmeterAktion(richtung);
    setLetzteAktion({ tor: result.tor });
    setTimeout(() => setWarteAufAnimation(false), 900);
  };

  const gewonnen = duell.elfmeterAbgeschlossen ? duell.elfmeterSpielerTore > duell.elfmeterGegnerTore : null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>⚽ ELFMETERSCHIESSEN</Text>
          <Text style={styles.gegner}>gegen {duell.gegnerName}</Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel} numberOfLines={1}>{vereinsName || 'Du'}</Text>
              <Text style={styles.scoreValue}>{duell.elfmeterSpielerTore}</Text>
            </View>
            <Text style={styles.scoreDivider}>:</Text>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel} numberOfLines={1}>{duell.gegnerName}</Text>
              <Text style={styles.scoreValue}>{duell.elfmeterGegnerTore}</Text>
            </View>
          </View>

          {letzteAktion && warteAufAnimation && (
            <Text style={[styles.feedback, { color: letzteAktion.tor ? '#22c55e' : '#ef4444' }]}>
              {letzteAktion.tor ? '⚽ TOR!' : '🧤 GEHALTEN!'}
            </Text>
          )}

          {!duell.elfmeterAbgeschlossen ? (
            <>
              <Text style={styles.prompt}>{promptText}</Text>
              <View style={styles.richtungRow}>
                {RICHTUNGEN.map((r) => (
                  <TouchableOpacity key={r.key} style={styles.richtungBtn} onPress={() => handlePress(r.key)} disabled={warteAufAnimation}>
                    <Text style={styles.richtungIcon}>{r.icon}</Text>
                    <Text style={styles.richtungLabel}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.ergebnisText, { color: gewonnen ? '#22c55e' : '#ef4444' }]}>{gewonnen ? '🎉 Gewonnen!' : '😔 Verloren!'}</Text>
              <TouchableOpacity style={styles.weiterBtn} onPress={onFertig}>
                <Text style={styles.weiterBtnText}>Weiter</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#020617f0', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#0f172a', borderRadius: 24, padding: 26, width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 2, borderColor: '#f0b90b' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  gegner: { color: '#94a3b8', fontSize: 13, fontWeight: '700', marginTop: 4, marginBottom: 18 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  scoreBox: { alignItems: 'center', width: 100 },
  scoreLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  scoreValue: { color: '#f0b90b', fontSize: 32, fontWeight: '900', marginTop: 4 },
  scoreDivider: { color: '#475569', fontSize: 24, fontWeight: '900' },
  feedback: { fontSize: 20, fontWeight: '900', marginBottom: 12 },
  prompt: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 14 },
  richtungRow: { flexDirection: 'row', gap: 12 },
  richtungBtn: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, alignItems: 'center', width: 88, borderWidth: 1, borderColor: '#334155' },
  richtungIcon: { fontSize: 28, marginBottom: 6 },
  richtungLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  ergebnisText: { fontSize: 22, fontWeight: '900', marginVertical: 10 },
  weiterBtn: { backgroundColor: '#f0b90b', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, marginTop: 8 },
  weiterBtnText: { color: '#000', fontSize: 14, fontWeight: '900' },
});