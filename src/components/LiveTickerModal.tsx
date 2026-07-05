import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { TickerEvent } from '../utils/ligaSystem';

interface Props {
  heimName: string;
  auswaertsName: string;
  heimTore: number;
  auswaertsTore: number;
  events: TickerEvent[];
  onFertig: () => void;
}

const GESAMTDAUER_MS = 22000; // ~22 Sekunden Liveticker

export default function LiveTickerModal({ heimName, auswaertsName, heimTore, auswaertsTore, events, onFertig }: Props) {
  const [sichtbareEvents, setSichtbareEvents] = useState<TickerEvent[]>([]);
  const [heimStand, setHeimStand] = useState(0);
  const [auswaertsStand, setAuswaertsStand] = useState(0);
  const [fertig, setFertig] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    const timers: ReturnType<typeof setTimeout>[] = [];

    events.forEach((event) => {
      const delay = (event.minute / 90) * GESAMTDAUER_MS;
      const t = setTimeout(() => {
        setSichtbareEvents((prev) => [...prev, event]);
        if (event.typ === 'heim') setHeimStand((prev) => prev + 1);
        if (event.typ === 'auswaerts') setAuswaertsStand((prev) => prev + 1);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      }, delay);
      timers.push(t);
    });

    const endTimer = setTimeout(() => setFertig(true), GESAMTDAUER_MS + 600);
    timers.push(endTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.liveHeader}>
          <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
          <Text style={styles.liveText}>{fertig ? 'ABPFIFF' : 'LIVE'}</Text>
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.teamName} numberOfLines={1}>{heimName}</Text>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>{heimStand} : {auswaertsStand}</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>{auswaertsName}</Text>
        </View>

        <ScrollView ref={scrollRef} style={styles.tickerFeed} contentContainerStyle={{ paddingVertical: 10 }}>
          {sichtbareEvents.map((event, i) => (
            <View key={i} style={styles.tickerLine}>
              <Text style={styles.tickerMinute}>{event.minute}'</Text>
              <Text
                style={[
                  styles.tickerText,
                  event.typ === 'heim' && styles.tickerTextHeim,
                  event.typ === 'auswaerts' && styles.tickerTextAuswaerts,
                ]}
              >
                {event.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {fertig && (
          <TouchableOpacity style={styles.fertigBtn} onPress={onFertig}>
            <Text style={styles.fertigBtnText}>✔ Ergebnis bestätigen</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617ee', zIndex: 200, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 420, height: '75%', backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 2, borderColor: '#1e293b', overflow: 'hidden' },

  liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 16, gap: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  liveText: { color: '#ef4444', fontSize: 13, fontWeight: '900', letterSpacing: 2 },

  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#1e293b' },
  teamName: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  scoreBox: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginHorizontal: 8 },
  scoreText: { color: '#f0b90b', fontSize: 22, fontWeight: '900' },

  tickerFeed: { flex: 1, paddingHorizontal: 16 },
  tickerLine: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  tickerMinute: { color: '#64748b', fontSize: 12, fontWeight: '800', width: 30 },
  tickerText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', flex: 1 },
  tickerTextHeim: { color: '#22c55e', fontWeight: '800' },
  tickerTextAuswaerts: { color: '#38bdf8', fontWeight: '800' },

  fertigBtn: { backgroundColor: '#22c55e', margin: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  fertigBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});