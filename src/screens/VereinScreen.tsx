import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore, KAMPAGNEN, SPONSOREN } from '../store/gameStore';
import { LIGEN_ORDNUNG } from '../utils/ligaSystem';

const formatCooldown = (ms: number) => {
  const totalSek = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSek / 60);
  const sek = totalSek % 60;
  return `${min}:${sek.toString().padStart(2, '0')}`;
};

export default function VereinScreen() {
  const { hype, fans, letzteKampagne, sponsorenAktiv, aktuelleLigaIndex, starteKampagne, schliesseSponsorAb } = useGameStore();
  const [jetzt, setJetzt] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setJetzt(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleKampagne = (id: string) => {
    const result = starteKampagne(id);
    if (!result.erfolg && result.verbleibendMs) {
      alert(`Noch ${formatCooldown(result.verbleibendMs)} bis diese Kampagne wieder verfügbar ist.`);
    } else if (!result.erfolg) {
      alert('Nicht genug Geld für diese Kampagne!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18 }}>
      <Text style={styles.screenTitle}>📣 Verein &amp; Öffentlichkeit</Text>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>🔥 Hype</Text>
          <Text style={styles.hypeValue}>{Math.round(hype)} / 100</Text>
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${hype}%`, backgroundColor: hype > 60 ? '#22c55e' : hype > 30 ? '#f0b90b' : '#ef4444' }]} />
        </View>
        <Text style={styles.hintText}>Bestimmt, wie viele Zuschauer bei Heimspielen kommen. Steigt bei Siegen, sinkt bei Niederlagen und mit der Zeit von selbst.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>❤️ Fans</Text>
          <Text style={styles.fansValue}>{fans.toLocaleString()}</Text>
        </View>
        <Text style={styles.hintText}>Wächst dauerhaft durch Siege und Kampagnen. Schaltet Sponsoren-Verträge frei.</Text>
      </View>

      <Text style={styles.sectionTitle}>Kampagnen</Text>
      {KAMPAGNEN.map((k) => {
        const letzte = letzteKampagne[k.id] || 0;
        const verbleibend = k.cooldownMs - (jetzt - letzte);
        const bereit = verbleibend <= 0;
        return (
          <View key={k.id} style={styles.kampagneCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kampagneName}>{k.icon} {k.name}</Text>
              <Text style={styles.kampagneEffekt}>+{k.hypeBoost} Hype · +{k.fansBoost} Fans</Text>
            </View>
            <TouchableOpacity style={[styles.kampagneBtn, !bereit && styles.kampagneBtnDisabled]} onPress={() => handleKampagne(k.id)} disabled={!bereit}>
              <Text style={styles.kampagneBtnText}>{bereit ? `${k.preis.toLocaleString()} €` : formatCooldown(verbleibend)}</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <Text style={styles.sectionTitle}>Sponsoren</Text>
      {SPONSOREN.map((s) => {
        const aktiv = sponsorenAktiv.includes(s.id);
        const ligaFreigeschaltet = aktuelleLigaIndex >= s.ligaIndex;
        const fansFreigeschaltet = fans >= s.benoetigteFans;
        const bereitZumAbschluss = ligaFreigeschaltet && fansFreigeschaltet;

        return (
          <View key={s.id} style={[styles.sponsorCard, aktiv && styles.sponsorCardAktiv]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sponsorName}>{s.name}</Text>
              <Text style={styles.sponsorLiga}>ab {LIGEN_ORDNUNG[s.ligaIndex]}</Text>
              {!aktiv && !ligaFreigeschaltet && (
                <Text style={styles.sponsorReq}>🔒 Erst ab {LIGEN_ORDNUNG[s.ligaIndex]} verfügbar</Text>
              )}
              {!aktiv && ligaFreigeschaltet && (
                <Text style={styles.sponsorReq}>
                  {bereitZumAbschluss ? 'Bereit zum Abschluss!' : `Ab ${s.benoetigteFans.toLocaleString()} Fans (du hast ${fans.toLocaleString()})`}
                </Text>
              )}
              {aktiv && <Text style={styles.sponsorAktivText}>✔ Aktiv · +{s.bonusProSekunde.toLocaleString()} €/s</Text>}
            </View>
            {!aktiv && ligaFreigeschaltet && (
              <TouchableOpacity style={[styles.sponsorBtn, !bereitZumAbschluss && styles.sponsorBtnDisabled]} onPress={() => schliesseSponsorAb(s.id)} disabled={!bereitZumAbschluss}>
                <Text style={styles.sponsorBtnText}>+{s.antrittspraemie.toLocaleString()} €</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  screenTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 18, textAlign: 'center' },
  sectionTitle: { color: '#64748b', fontSize: 13, fontWeight: '800', marginTop: 10, marginBottom: 10, letterSpacing: 0.5 },

  card: { backgroundColor: '#111622', padding: 16, borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1a2233' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  hypeValue: { color: '#f0b90b', fontSize: 15, fontWeight: '900' },
  fansValue: { color: '#ef4444', fontSize: 16, fontWeight: '900' },
  barContainer: { height: 12, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
  barFill: { height: '100%' },
  hintText: { color: '#64748b', fontSize: 12, fontWeight: '600', lineHeight: 17 },

  kampagneCard: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 14, borderRadius: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  kampagneName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  kampagneEffekt: { color: '#38bdf8', fontSize: 12, fontWeight: '600', marginTop: 2 },
  kampagneBtn: { backgroundColor: '#22c55e', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  kampagneBtnDisabled: { backgroundColor: '#475569' },
  kampagneBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  sponsorCard: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 14, borderRadius: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  sponsorCardAktiv: { borderColor: '#22c55e' },
  sponsorName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  sponsorLiga: { color: '#64748b', fontSize: 11, fontWeight: '700', marginTop: 1 },
  sponsorReq: { color: '#f0b90b', fontSize: 11, fontWeight: '700', marginTop: 4 },
  sponsorAktivText: { color: '#22c55e', fontSize: 12, fontWeight: '800', marginTop: 4 },
  sponsorBtn: { backgroundColor: '#f0b90b', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  sponsorBtnDisabled: { backgroundColor: '#334155' },
  sponsorBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },
});