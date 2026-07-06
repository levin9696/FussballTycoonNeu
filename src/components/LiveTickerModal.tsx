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
  const [halbzeitSichtbar, setHalbzeitSichtbar] = useState(false);
  const [torBanner, setTorBanner] = useState<{ team: string; heim: boolean } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const minutenProgress = useRef(new Animated.Value(0)).current;
  const halbzeitOpacity = useRef(new Animated.Value(0)).current;
  const torBannerScale = useRef(new Animated.Value(0)).current;
  const scoreboxPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(minutenProgress, { toValue: 1, duration: GESAMTDAUER_MS, useNativeDriver: false }).start();

    const timers: ReturnType<typeof setTimeout>[] = [];

    events.forEach((event) => {
      const delay = (event.minute / 90) * GESAMTDAUER_MS;
      const t = setTimeout(() => {
        setSichtbareEvents((prev) => [...prev, event]);

        if (event.typ === 'heim' || event.typ === 'auswaerts') {
          if (event.typ === 'heim') setHeimStand((prev) => prev + 1);
          if (event.typ === 'auswaerts') setAuswaertsStand((prev) => prev + 1);

          setTorBanner({ team: event.typ === 'heim' ? heimName : auswaertsName, heim: event.typ === 'heim' });
          torBannerScale.setValue(0);
          Animated.sequence([
            Animated.spring(torBannerScale, { toValue: 1, friction: 5, useNativeDriver: true }),
            Animated.delay(1100),
            Animated.timing(torBannerScale, { toValue: 0, duration: 250, useNativeDriver: true }),
          ]).start(() => setTorBanner(null));

          Animated.sequence([
            Animated.timing(scoreboxPulse, { toValue: 1.25, duration: 180, useNativeDriver: true }),
            Animated.timing(scoreboxPulse, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]).start();
        }

        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      }, delay);
      timers.push(t);
    });

    const halbzeitTimer = setTimeout(() => {
      setHalbzeitSichtbar(true);
      Animated.sequence([
        Animated.timing(halbzeitOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(halbzeitOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setHalbzeitSichtbar(false));
    }, GESAMTDAUER_MS / 2);
    timers.push(halbzeitTimer);

    const endTimer = setTimeout(() => setFertig(true), GESAMTDAUER_MS + 600);
    timers.push(endTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  const minutenBreite = minutenProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.liveHeader}>
          <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
          <Text style={styles.liveText}>{fertig ? 'ABPFIFF' : 'LIVE'}</Text>
        </View>

        <View style={styles.minuteBarWrap}>
          <View style={styles.minuteBarTrack}>
            <Animated.View style={[styles.minuteBarFill, { width: minutenBreite }]} />
            <View style={styles.minuteBarHalftimeMark} />
          </View>
        </View>

        <Animated.View style={[styles.scoreRow, { transform: [{ scale: scoreboxPulse }] }]}>
          <Text style={styles.teamName} numberOfLines={1}>{heimName}</Text>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>{heimStand} : {auswaertsStand}</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>{auswaertsName}</Text>
        </Animated.View>

        <ScrollView ref={scrollRef} style={styles.tickerFeed} contentContainerStyle={{ paddingVertical: 10 }}>
          {sichtbareEvents.map((event, i) => (
            <View key={i} style={[styles.tickerLine, (event.typ === 'heim' || event.typ === 'auswaerts') && styles.tickerLineTor]}>
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

        {halbzeitSichtbar && (
          <Animated.View pointerEvents="none" style={[styles.halbzeitBanner, { opacity: halbzeitOpacity }]}>
            <Text style={styles.halbzeitText}>⏸ HALBZEIT</Text>
          </Animated.View>
        )}

        {torBanner && (
          <Animated.View pointerEvents="none" style={[styles.torBanner, { transform: [{ scale: torBannerScale }] }, torBanner.heim ? styles.torBannerHeim : styles.torBannerAuswaerts]}>
            <Text style={styles.torBannerEmoji}>⚽</Text>
            <Text style={styles.torBannerText}>TOR!</Text>
            <Text style={styles.torBannerTeam} numberOfLines={1}>{torBanner.team}</Text>
          </Animated.View>
        )}

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
  modal: { width: '100%', maxWidth: 420, height: '78%', backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 2, borderColor: '#1e293b', overflow: 'hidden' },

  liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 16, gap: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  liveText: { color: '#ef4444', fontSize: 13, fontWeight: '900', letterSpacing: 2 },

  minuteBarWrap: { paddingHorizontal: 16, paddingTop: 10 },
  minuteBarTrack: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'visible', position: 'relative' },
  minuteBarFill: { height: '100%', backgroundColor: '#f0b90b', borderRadius: 3 },
  minuteBarHalftimeMark: { position: 'absolute', left: '50%', top: -2, width: 2, height: 10, backgroundColor: '#64748b' },

  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#1e293b' },
  teamName: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  scoreBox: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginHorizontal: 8, borderWidth: 1, borderColor: '#f0b90b55' },
  scoreText: { color: '#f0b90b', fontSize: 22, fontWeight: '900' },

  tickerFeed: { flex: 1, paddingHorizontal: 16 },
  tickerLine: { flexDirection: 'row', marginBottom: 10, gap: 8, paddingVertical: 2 },
  tickerLineTor: { backgroundColor: '#f0b90b15', borderRadius: 8, paddingHorizontal: 6 },
  tickerMinute: { color: '#64748b', fontSize: 12, fontWeight: '800', width: 30 },
  tickerText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', flex: 1 },
  tickerTextHeim: { color: '#22c55e', fontWeight: '800' },
  tickerTextAuswaerts: { color: '#38bdf8', fontWeight: '800' },

  halbzeitBanner: { position: 'absolute', top: '38%', left: 30, right: 30, backgroundColor: '#000000cc', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f0b90b' },
  halbzeitText: { color: '#f0b90b', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  torBanner: { position: 'absolute', top: '32%', left: 24, right: 24, backgroundColor: '#000000e6', borderRadius: 20, paddingVertical: 20, alignItems: 'center', borderWidth: 3 },
  torBannerHeim: { borderColor: '#22c55e' },
  torBannerAuswaerts: { borderColor: '#38bdf8' },
  torBannerEmoji: { fontSize: 44 },
  torBannerText: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  torBannerTeam: { color: '#f0b90b', fontSize: 13, fontWeight: '800', marginTop: 4, maxWidth: '90%' },

  fertigBtn: { backgroundColor: '#22c55e', margin: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  fertigBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});