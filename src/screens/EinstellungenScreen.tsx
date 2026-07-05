import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useGameStore, formatGeld } from '../store/gameStore';

export default function EinstellungenScreen({ onClose }: { onClose: () => void }) {
  const { vereinsName, aendereVereinsName, gesamtKlicks, gesamtAusgegeben, gesamtPacksGekauft, gesamtSiege, gesamtRemis, gesamtNiederlagen } = useGameStore();
  const [nameInput, setNameInput] = useState(vereinsName);

  const gesamtSpiele = gesamtSiege + gesamtRemis + gesamtNiederlagen;
  const siegProzent = gesamtSpiele > 0 ? (gesamtSiege / gesamtSpiele) * 100 : 0;
  const remisProzent = gesamtSpiele > 0 ? (gesamtRemis / gesamtSpiele) * 100 : 0;
  const niederlageProzent = gesamtSpiele > 0 ? (gesamtNiederlagen / gesamtSpiele) * 100 : 0;

  const speichern = () => { if (nameInput.trim().length > 0) aendereVereinsName(nameInput); };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>✕</Text></TouchableOpacity>
        <Text style={styles.title}>⚙️ Einstellungen</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vereinsname</Text>
          <TextInput style={styles.input} value={nameInput} onChangeText={setNameInput} maxLength={24} placeholder="Vereinsname" placeholderTextColor="#64748b" />
          <TouchableOpacity style={styles.saveBtn} onPress={speichern}><Text style={styles.saveBtnText}>Speichern</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Statistiken</Text>
          <View style={styles.statRow}><Text style={styles.statLabel}>Gesamt-Klicks</Text><Text style={styles.statValue}>{gesamtKlicks.toLocaleString('de-DE')}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Gesamt ausgegeben</Text><Text style={styles.statValue}>{formatGeld(gesamtAusgegeben)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Packs gekauft</Text><Text style={styles.statValue}>{gesamtPacksGekauft.toLocaleString('de-DE')}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚽ Bilanz ({gesamtSpiele} Spiele)</Text>
          <View style={styles.bilanzBar}>
            {siegProzent > 0 && <View style={[styles.bilanzSegment, { flex: siegProzent, backgroundColor: '#22c55e' }]} />}
            {remisProzent > 0 && <View style={[styles.bilanzSegment, { flex: remisProzent, backgroundColor: '#f0b90b' }]} />}
            {niederlageProzent > 0 && <View style={[styles.bilanzSegment, { flex: niederlageProzent, backgroundColor: '#ef4444' }]} />}
            {gesamtSpiele === 0 && <View style={[styles.bilanzSegment, { flex: 1, backgroundColor: '#334155' }]} />}
          </View>
          <View style={styles.bilanzLegende}>
            <Text style={styles.bilanzItem}>🟢 {gesamtSiege} Siege</Text>
            <Text style={styles.bilanzItem}>🟡 {gesamtRemis} Remis</Text>
            <Text style={styles.bilanzItem}>🔴 {gesamtNiederlagen} Niederlagen</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingTop: 50, backgroundColor: '#0f172a', borderBottomWidth: 1, borderColor: '#1e293b' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  card: { backgroundColor: '#111622', padding: 18, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1a2233' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  saveBtn: { backgroundColor: '#22c55e', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  statLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  statValue: { color: '#fff', fontSize: 13, fontWeight: '800' },
  bilanzBar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 12 },
  bilanzSegment: { height: '100%' },
  bilanzLegende: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bilanzItem: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
});