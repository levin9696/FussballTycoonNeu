import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { berechneTabelle, getSpieltageProSaison, LIGEN_ORDNUNG, LIGEN } from '../utils/ligaSystem';

export default function LigaScreen() {
  const { teams, spielplan, aktuelleLigaIndex, relegationsDuell } = useGameStore();
  const [tab, setTab] = useState<'tabelle' | 'spielplan' | 'ligen'>('tabelle');

  const aktuelleLiga = LIGEN_ORDNUNG[aktuelleLigaIndex];
  const tabelle = teams.length > 0 ? berechneTabelle(teams, spielplan) : [];
  const spieltage = Array.from(new Set(spielplan.map((s) => s.spieltag))).sort((a, b) => a - b);
  const spieltageProSaison = teams.length > 0 ? getSpieltageProSaison(aktuelleLiga) : 0;
  const teamAnzahl = teams.length;

  const nameFuerId = (id: string) => teams.find((t) => t.id === id)?.name || id;
  const zonenFarbe = (platz: number) => {
    if (platz === 1) return '#22c55e';
    if (platz === 2) return '#eab308';
    if (platz === teamAnzahl - 1) return '#f97316';
    if (platz === teamAnzahl) return '#ef4444';
    return 'transparent';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 {aktuelleLiga}</Text>
        <Text style={styles.subtitle}>{teamAnzahl} Teams · {spieltageProSaison} Spieltage/Saison</Text>
      </View>

      {relegationsDuell && (
        <View style={styles.relegationBanner}>
          <Text style={styles.relegationTitle}>⚔️ {relegationsDuell.typ === 'aufstieg' ? 'Aufstiegs-Relegation' : 'Abstiegs-Relegation'} gegen {relegationsDuell.gegnerName}</Text>
          <View style={styles.relegationScoreRow}>
            <Text style={styles.relegationLeg}>Hinspiel: {relegationsDuell.hinspielGespielt ? `${relegationsDuell.hinspielSpielerTore} : ${relegationsDuell.hinspielGegnerTore}` : 'ausstehend'}</Text>
            <Text style={styles.relegationLeg}>Rückspiel: {relegationsDuell.rueckspielGespielt ? `${relegationsDuell.rueckspielGegnerTore} : ${relegationsDuell.rueckspielSpielerTore}` : 'ausstehend'}</Text>
          </View>
          {relegationsDuell.hinspielGespielt && (
            <Text style={styles.relegationGesamt}>Gesamt: {(relegationsDuell.hinspielSpielerTore || 0) + (relegationsDuell.rueckspielSpielerTore || 0)} : {(relegationsDuell.hinspielGegnerTore || 0) + (relegationsDuell.rueckspielGegnerTore || 0)}</Text>
          )}
        </View>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'tabelle' && styles.tabBtnActive]} onPress={() => setTab('tabelle')}><Text style={[styles.tabBtnText, tab === 'tabelle' && styles.tabBtnTextActive]}>Tabelle</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'spielplan' && styles.tabBtnActive]} onPress={() => setTab('spielplan')}><Text style={[styles.tabBtnText, tab === 'spielplan' && styles.tabBtnTextActive]}>Spielplan</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'ligen' && styles.tabBtnActive]} onPress={() => setTab('ligen')}><Text style={[styles.tabBtnText, tab === 'ligen' && styles.tabBtnTextActive]}>Alle Ligen</Text></TouchableOpacity>
      </View>

      {tab === 'ligen' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15 }}>
          {LIGEN.map((_, idx) => idx).reverse().map((idx) => {
            const liga = LIGEN[idx];
            const istAktuell = idx === aktuelleLigaIndex;
            const istErreicht = idx <= aktuelleLigaIndex;
            return (
              <View key={liga.name} style={[styles.ligaListItem, istAktuell && styles.ligaListItemAktuell, !istErreicht && styles.ligaListItemGesperrt]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ligaListName, istAktuell && styles.ligaListNameAktuell]}>{istAktuell ? '⭐ ' : ''}{liga.name}</Text>
                  <Text style={styles.ligaListMeta}>{liga.teams} Teams · Rating {liga.gesamtwertMin}-{liga.gesamtwertMax}</Text>
                </View>
                <Text style={styles.ligaListPraemie}>🏆 {liga.siegPraemie.toLocaleString('de-DE')} €</Text>
              </View>
            );
          })}
        </ScrollView>
      ) : teams.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyText}>Noch keine Saison gestartet. Geh auf Home und starte dein erstes Spiel!</Text></View>
      ) : tab === 'tabelle' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15 }}>
          <View style={styles.tabelleHeaderRow}>
            <Text style={[styles.thCell, { width: 26 }]}>#</Text><Text style={[styles.thCell, { flex: 1 }]}>Team</Text>
            <Text style={styles.thCell}>Sp</Text><Text style={styles.thCell}>S</Text><Text style={styles.thCell}>U</Text><Text style={styles.thCell}>N</Text><Text style={styles.thCell}>Diff</Text><Text style={styles.thCell}>Pkt</Text>
          </View>
          {tabelle.map((row, idx) => (
            <View key={row.teamId} style={[styles.tabelleRow, row.istSpieler && styles.tabelleRowSpieler]}>
              <View style={[styles.zoneBar, { backgroundColor: zonenFarbe(idx + 1) }]} />
              <Text style={[styles.tdCell, { width: 26 }]}>{idx + 1}</Text>
              <Text style={[styles.tdCell, { flex: 1, fontWeight: row.istSpieler ? '900' : '600' }]} numberOfLines={1}>{row.istSpieler ? '⭐ ' : ''}{row.name}</Text>
              <Text style={styles.tdCell}>{row.spiele}</Text><Text style={styles.tdCell}>{row.siege}</Text><Text style={styles.tdCell}>{row.unentschieden}</Text><Text style={styles.tdCell}>{row.niederlagen}</Text>
              <Text style={styles.tdCell}>{row.tore - row.gegentore}</Text><Text style={[styles.tdCell, { fontWeight: '900', color: '#f0b90b' }]}>{row.punkte}</Text>
            </View>
          ))}
          <View style={styles.legende}>
            <Text style={styles.legendeItem}>🟢 Aufstieg</Text><Text style={styles.legendeItem}>🟡 Relegation (auf)</Text>
            <Text style={styles.legendeItem}>🟠 Relegation (ab)</Text><Text style={styles.legendeItem}>🔴 Abstieg</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15 }}>
          {spieltage.map((spieltag) => (
            <View key={spieltag} style={styles.spieltagBlock}>
              <Text style={styles.spieltagTitel}>Spieltag {spieltag}</Text>
              {spielplan.filter((s) => s.spieltag === spieltag).map((s) => {
                const spielerDabei = s.heimId === 'spieler' || s.auswaertsId === 'spieler';
                return (
                  <View key={s.id} style={[styles.matchRow, spielerDabei && styles.matchRowSpieler]}>
                    <Text style={[styles.matchTeam, { textAlign: 'right' }]} numberOfLines={1}>{nameFuerId(s.heimId)}</Text>
                    <Text style={styles.matchScore}>{s.gespielt ? `${s.heimTore} : ${s.auswaertsTore}` : '- : -'}</Text>
                    <Text style={styles.matchTeam} numberOfLines={1}>{nameFuerId(s.auswaertsId)}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 20, backgroundColor: '#0f172a', alignItems: 'center', borderBottomWidth: 1, borderColor: '#1e293b' },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 4 },
  relegationBanner: { backgroundColor: '#7c1d1d', margin: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#ef4444' },
  relegationTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginBottom: 8 },
  relegationScoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  relegationLeg: { color: '#fecaca', fontSize: 12, fontWeight: '700' },
  relegationGesamt: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#0f172a', paddingHorizontal: 15, paddingTop: 10, gap: 8 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#1e293b' },
  tabBtnActive: { backgroundColor: '#f0b90b' },
  tabBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  tabBtnTextActive: { color: '#000' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { color: '#64748b', textAlign: 'center', fontSize: 14 },
  tabelleHeaderRow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 6 },
  thCell: { color: '#64748b', fontSize: 10, fontWeight: '800', width: 34, textAlign: 'center' },
  tabelleRow: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 8, alignItems: 'center', paddingVertical: 8, marginBottom: 4, overflow: 'hidden' },
  tabelleRowSpieler: { borderWidth: 1, borderColor: '#f0b90b' },
  zoneBar: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0 },
  tdCell: { color: '#fff', fontSize: 12, fontWeight: '700', width: 34, textAlign: 'center', paddingLeft: 6 },
  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
  legendeItem: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  spieltagBlock: { marginBottom: 18 },
  spieltagTitel: { color: '#64748b', fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  matchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6 },
  matchRowSpieler: { borderWidth: 1, borderColor: '#f0b90b' },
  matchTeam: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '700' },
  matchScore: { color: '#f0b90b', fontSize: 13, fontWeight: '900', marginHorizontal: 10, width: 50, textAlign: 'center' },
  ligaListItem: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  ligaListItemAktuell: { borderColor: '#f0b90b', backgroundColor: '#1e2333' },
  ligaListItemGesperrt: { opacity: 0.4 },
  ligaListName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  ligaListNameAktuell: { color: '#f0b90b' },
  ligaListMeta: { color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 2 },
  ligaListPraemie: { color: '#22c55e', fontSize: 12, fontWeight: '800' },
});