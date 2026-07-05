import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  useGameStore, CLICK_WERTE, CLICK_LEVELS, istAufstellungKomplett, berechneGesamtwert,
  berechneGesamtPassivEinkommenProSekunde, formatGeld, SpieltagErgebnis,
} from './src/store/gameStore';
import { LIGEN_ORDNUNG, generateTickerEvents } from './src/utils/ligaSystem';

import PackScreen from './src/screens/PackScreen';
import KaderScreen from './src/screens/KaderScreen';
import LigaScreen from './src/screens/LigaScreen';
import UpgradeScreen from './src/screens/UpgradeScreen';
import VereinScreen from './src/screens/VereinScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import EinstellungenScreen from './src/screens/EinstellungenScreen';
import LiveTickerModal from './src/components/LiveTickerModal';
import RelegationsPenaltyModal from './src/components/RelegationsPenaltyModal';

type TabKey = 'home' | 'upgrades' | 'kader' | 'shop' | 'verein' | 'liga';

const TABS: Array<{ key: TabKey; label: string; icon: any }> = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'upgrades', label: 'Upgrades', icon: 'trending-up' },
  { key: 'kader', label: 'Team', icon: 'people' },
  { key: 'shop', label: 'Shop', icon: 'gift' },
  { key: 'verein', label: 'Verein', icon: 'megaphone' },
  { key: 'liga', label: 'Liga', icon: 'trophy' },
];

function HeaderDashboard({ insetsTop, onOpenSettings }: { insetsTop: number; onOpenSettings: () => void }) {
  const { geld, vereinsName, upgrades, sponsorenAktiv } = useGameStore();
  const einkommenProSekunde = berechneGesamtPassivEinkommenProSekunde(upgrades, sponsorenAktiv);

  return (
    <View style={[styles.header, { paddingTop: insetsTop + 10 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerClub} numberOfLines={1}>{vereinsName}</Text>
        <Text style={styles.headerTitle}>{formatGeld(geld)}</Text>
      </View>
      <View style={styles.incomePill}>
        <Ionicons name="trending-up" size={13} color="#38bdf8" />
        <Text style={styles.headerSubtitle}>{formatGeld(einkommenProSekunde)}/s</Text>
      </View>
      <TouchableOpacity style={styles.settingsBtn} onPress={onOpenSettings}>
        <Ionicons name="settings-outline" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}

function TabBar({ current, onChange, insetsBottom }: { current: TabKey; onChange: (t: TabKey) => void; insetsBottom: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { paddingBottom: Math.max(insetsBottom, 8) }]} contentContainerStyle={{ flexGrow: 1 }}>
      {TABS.map((tab) => {
        const active = current === tab.key;
        return (
          <Pressable key={tab.key} style={styles.tabButton} onPress={() => onChange(tab.key)}>
            <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
              <Ionicons name={active ? tab.icon : `${tab.icon}-outline`} size={19} color={active ? '#000' : '#64748b'} />
            </View>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const formatCountdown = (ms: number) => {
  const totalSek = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSek / 60);
  const sek = totalSek % 60;
  return `${min}:${sek.toString().padStart(2, '0')}`;
};

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  const slide = useRef(new Animated.Value(-100)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 7 }),
      Animated.delay(2200),
      Animated.timing(slide, { toValue: -100, duration: 300, useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);
  return <Animated.View style={[styles.toast, { transform: [{ translateY: slide }] }]}><Text style={styles.toastText}>{text}</Text></Animated.View>;
}

function SaisonEndeModal({ nachricht, bonus, onClose }: { nachricht: string; bonus: number; onClose: () => void }) {
  const istAufstieg = nachricht.includes('🏆') || nachricht.includes('🎉');
  const scale = useRef(new Animated.Value(0.7)).current;
  useEffect(() => { Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start(); }, []);
  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.saisonModal, istAufstieg && styles.saisonModalAufstieg, { transform: [{ scale }] }]}>
        <Text style={styles.saisonEmoji}>{istAufstieg ? '🎉' : '📋'}</Text>
        <Text style={styles.saisonText}>{nachricht}</Text>
        {bonus > 0 && <Text style={styles.saisonBonus}>+ {formatGeld(bonus)} Bonus!</Text>}
        <TouchableOpacity style={styles.saisonBtn} onPress={onClose}><Text style={styles.saisonBtnText}>Weiter</Text></TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function OfflinePopup({ betrag, onClose }: { betrag: number; onClose: () => void }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  useEffect(() => { Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start(); }, []);
  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.offlineModal, { transform: [{ scale }] }]}>
        <Text style={styles.saisonEmoji}>💤</Text>
        <Text style={styles.saisonText}>Willkommen zurück!</Text>
        <Text style={styles.saisonBonus}>+ {formatGeld(betrag)} verdient, während du weg warst</Text>
        <TouchableOpacity style={styles.saisonBtn} onPress={onClose}><Text style={styles.saisonBtnText}>Abholen</Text></TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function HomeScreen({ onGoToKader }: { onGoToKader: () => void }) {
  const {
    kader, geld, upgrades, sponsorenAktiv, clickHome, clicksInCurrentLevel, clickLevel,
    teams, aktuellerSpieltag, naechstesSpielZeitpunkt, aktuelleLigaIndex,
    aufstellungSlots, formation, hype, relegationsDuell,
    starteNeueSaison, simuliereNaechstenSpieltag, simuliereRelegationsSpiel,
  } = useGameStore();

  const [jetzt, setJetzt] = useState(Date.now());
  const [tickerDaten, setTickerDaten] = useState<SpieltagErgebnis | null>(null);
  const [relegationsTicker, setRelegationsTicker] = useState<{ heimName: string; auswaertsName: string; heimTore: number; auswaertsTore: number; events: any[]; benoetigtElfmeter: boolean } | null>(null);
  const [saisonModal, setSaisonModal] = useState<{ nachricht: string; bonus: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clickScale = useRef(new Animated.Value(1)).current;

  useEffect(() => { if (teams.length === 0 && !relegationsDuell) starteNeueSaison(); }, []);
  useEffect(() => { const interval = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(interval); }, []);

  const aktuelleLiga = LIGEN_ORDNUNG[aktuelleLigaIndex];
  const einkommenProSekunde = berechneGesamtPassivEinkommenProSekunde(upgrades, sponsorenAktiv);

  const basisWert = CLICK_WERTE[Math.min(clickLevel - 1, CLICK_WERTE.length - 1)];
  const einkommensBonus = Math.round(einkommenProSekunde * 0.15);
  const geldProKlick = basisWert + einkommensBonus;
  const benötigteKlicks = CLICK_LEVELS[Math.min(clickLevel - 1, CLICK_LEVELS.length - 1)];
  const fortschrittProzent = Math.min((clicksInCurrentLevel / benötigteKlicks) * 100, 100);

  const restZeit = (relegationsDuell ? relegationsDuell.naechstesSpielZeitpunkt : naechstesSpielZeitpunkt) - jetzt;
  const aufstellungKomplett = istAufstellungKomplett(aufstellungSlots, formation);
  const teamRating = berechneGesamtwert(aufstellungSlots, formation);
  const spielBereit = restZeit <= 0 && teams.length > 0 && aufstellungKomplett;

  const handleClick = () => {
    clickHome();
    clickScale.setValue(0.93);
    Animated.spring(clickScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  };

  const spielStarten = () => {
    const ergebnis = simuliereNaechstenSpieltag();
    if (ergebnis) setTickerDaten(ergebnis);
  };

  const relegationsSpielStarten = () => {
    const result = simuliereRelegationsSpiel();
    if (!result) return;
    const events = generateTickerEvents(result.heimName, result.auswaertsName, result.heimTore, result.auswaertsTore);
    setRelegationsTicker({ heimName: result.heimName, auswaertsName: result.auswaertsName, heimTore: result.heimTore, auswaertsTore: result.auswaertsTore, events, benoetigtElfmeter: result.benoetigtElfmeter });
  };

  const tickerSchliessen = () => {
    if (!tickerDaten) return;
    const { spielerIstHeim, heimTore, auswaertsTore, praemie, spieltagEinnahmen, saisonEndeNachricht, aufstiegsBonus, relegationAusgeloest } = tickerDaten;
    const spielerTore = spielerIstHeim ? heimTore : auswaertsTore;
    const gegnerTore = spielerIstHeim ? auswaertsTore : heimTore;
    const ergebnisText = spielerTore > gegnerTore ? '🎉 Sieg!' : spielerTore === gegnerTore ? '🤝 Unentschieden' : '😔 Niederlage';
    const gesamtBetrag = praemie + spieltagEinnahmen;
    const zusatz = spieltagEinnahmen > 0 ? ` (davon ${formatGeld(spieltagEinnahmen)} Zuschauereinnahmen)` : '';
    setToast(`${ergebnisText} +${formatGeld(gesamtBetrag)}${zusatz}`);
    setTickerDaten(null);
    if (saisonEndeNachricht && !relegationAusgeloest) setTimeout(() => setSaisonModal({ nachricht: saisonEndeNachricht, bonus: aufstiegsBonus }), 400);
  };

  const relegationsTickerSchliessen = () => {
    setRelegationsTicker(null);
    // Elfmeter-Modal uebernimmt automatisch, falls benoetigt (relegationsDuell.elfmeterAktiv wird direkt aus dem Store gelesen)
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#020617' }} contentContainerStyle={{ padding: 18 }}>
      <Pressable onPress={handleClick}>
        <Animated.View style={[styles.clickerButton, { transform: [{ scale: clickScale }] }]}>
          <View style={styles.clickerGlow} />
          <Text style={styles.clickerEmoji}>⚽</Text>
          <Text style={styles.clickerText}>VEREINSMANAGEMENT</Text>
          <View style={styles.clickerValuePill}><Text style={styles.clickerSubText}>+{formatGeld(geldProKlick)}</Text></View>
          {einkommensBonus > 0 && <Text style={styles.clickerBreakdown}>Basis {basisWert} € + {formatGeld(einkommensBonus)} Einkommens-Bonus</Text>}
        </Animated.View>
      </Pressable>

      <View style={styles.clickBarCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={styles.clickBarLabel}>Klick-Stufe {clickLevel}</Text>
          <Text style={styles.clickBarCount}>{clicksInCurrentLevel} / {benötigteKlicks}</Text>
        </View>
        <View style={styles.clickBarContainer}><View style={[styles.clickBarFill, { width: `${fortschrittProzent}%` }]} /></View>
      </View>

      {relegationsDuell ? (
        <View style={[styles.ligaCard, styles.relegationCard]}>
          <View style={styles.ligaCardTop}>
            <Ionicons name="skull" size={18} color="#ef4444" />
            <Text style={styles.ligaCardTitle}>{relegationsDuell.typ === 'aufstieg' ? 'Aufstiegs-Relegation' : 'Abstiegs-Relegation'}</Text>
          </View>
          <Text style={styles.relegationGegner}>gegen {relegationsDuell.gegnerName}</Text>
          <View style={styles.ratingRow}>
            <View style={{ alignItems: 'center' }}><Text style={styles.teamRatingLabel}>Hinspiel</Text><Text style={styles.teamRatingValue}>{relegationsDuell.hinspielGespielt ? `${relegationsDuell.hinspielSpielerTore}:${relegationsDuell.hinspielGegnerTore}` : '-'}</Text></View>
            <View style={{ alignItems: 'center' }}><Text style={styles.teamRatingLabel}>Rückspiel</Text><Text style={styles.teamRatingValue}>{relegationsDuell.rueckspielGespielt ? `${relegationsDuell.rueckspielGegnerTore}:${relegationsDuell.rueckspielSpielerTore}` : '-'}</Text></View>
          </View>
          {!aufstellungKomplett ? (
            <View style={styles.warnBox}>
              <Ionicons name="warning" size={22} color="#fca5a5" />
              <Text style={styles.warnText}>Startelf nicht komplett!</Text>
              <TouchableOpacity style={styles.warnBtn} onPress={onGoToKader}><Text style={styles.warnBtnText}>Zur Aufstellung</Text></TouchableOpacity>
            </View>
          ) : spielBereit ? (
            <TouchableOpacity style={[styles.spielBtn, { backgroundColor: '#ef4444' }]} onPress={relegationsSpielStarten} activeOpacity={0.85}>
              <Ionicons name="flame" size={18} color="#fff" />
              <Text style={styles.spielBtnText}>{relegationsDuell.hinspielGespielt ? 'Rückspiel starten' : 'Hinspiel starten'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownBox}><Text style={styles.countdownLabel}>Nächstes Spiel in</Text><Text style={styles.countdownZeit}>{formatCountdown(restZeit)}</Text></View>
          )}
        </View>
      ) : (
        <View style={styles.ligaCard}>
          <View style={styles.ligaCardTop}>
            <Ionicons name="trophy" size={18} color="#f0b90b" />
            <Text style={styles.ligaCardTitle}>{aktuelleLiga} · Spieltag {aktuellerSpieltag}</Text>
          </View>
          <View style={styles.ratingRow}>
            <View style={{ alignItems: 'center' }}><Text style={styles.teamRatingLabel}>Team-Rating</Text><Text style={styles.teamRatingValue}>{teamRating}</Text></View>
            <View style={{ alignItems: 'center' }}><Text style={styles.teamRatingLabel}>Hype</Text><Text style={[styles.teamRatingValue, { color: hype > 60 ? '#22c55e' : hype > 30 ? '#f0b90b' : '#ef4444' }]}>{Math.round(hype)}</Text></View>
          </View>
          {!aufstellungKomplett ? (
            <View style={styles.warnBox}>
              <Ionicons name="warning" size={22} color="#fca5a5" />
              <Text style={styles.warnText}>Startelf nicht komplett!</Text>
              <TouchableOpacity style={styles.warnBtn} onPress={onGoToKader}><Text style={styles.warnBtnText}>Zur Aufstellung</Text></TouchableOpacity>
            </View>
          ) : spielBereit ? (
            <TouchableOpacity style={styles.spielBtn} onPress={spielStarten} activeOpacity={0.85}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.spielBtnText}>Spiel starten</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownBox}><Text style={styles.countdownLabel}>Nächstes Spiel in</Text><Text style={styles.countdownZeit}>{formatCountdown(restZeit)}</Text></View>
          )}
        </View>
      )}

      <View style={styles.homeCard}>
        <Text style={styles.homeCardTitle}>📈 Vereins-Statistiken</Text>
        <View style={styles.statRow}><Text style={styles.statLabel}>Kontostand</Text><Text style={[styles.statValue, { color: '#22c55e' }]}>{formatGeld(geld)}</Text></View>
        <View style={styles.statRow}><Text style={styles.statLabel}>Passive Einnahmen</Text><Text style={[styles.statValue, { color: '#38bdf8' }]}>+{formatGeld(einkommenProSekunde)}/s</Text></View>
        <View style={styles.statRow}><Text style={styles.statLabel}>Spieler im Kader</Text><Text style={styles.statValue}>{kader.length} / 50</Text></View>
      </View>

      {tickerDaten && (
        <LiveTickerModal heimName={tickerDaten.heimName} auswaertsName={tickerDaten.auswaertsName} heimTore={tickerDaten.heimTore} auswaertsTore={tickerDaten.auswaertsTore} events={tickerDaten.events} onFertig={tickerSchliessen} />
      )}
      {relegationsTicker && (
        <LiveTickerModal heimName={relegationsTicker.heimName} auswaertsName={relegationsTicker.auswaertsName} heimTore={relegationsTicker.heimTore} auswaertsTore={relegationsTicker.auswaertsTore} events={relegationsTicker.events} onFertig={relegationsTickerSchliessen} />
      )}
      {relegationsDuell?.elfmeterAktiv && !relegationsDuell.elfmeterAbgeschlossen === false && relegationsDuell.elfmeterAktiv && (
        <RelegationsPenaltyModal onFertig={() => setSaisonModal(null)} />
      )}
      {saisonModal && <SaisonEndeModal nachricht={saisonModal.nachricht} bonus={saisonModal.bonus} onClose={() => setSaisonModal(null)} />}
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </ScrollView>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [zeigeEinstellungen, setZeigeEinstellungen] = useState(false);
  const [hydrated, setHydrated] = useState(useGameStore.persist.hasHydrated());
  const [offlineBetrag, setOfflineBetrag] = useState<number | null>(null);

  const { upgrades, sponsorenAktiv, addPassiveEinnahmen, aktualisiereZeitstempel, aktualisiereHypeVerfall, hatOnboardingAbgeschlossen, berechneUndGutschreibeOfflineEinkommen } = useGameStore();

  useEffect(() => {
    const unsub = useGameStore.persist.onFinishHydration(() => setHydrated(true));
    if (useGameStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && hatOnboardingAbgeschlossen) {
      const verdient = berechneUndGutschreibeOfflineEinkommen();
      if (verdient > 0) setOfflineBetrag(verdient);
    }
  }, [hydrated, hatOnboardingAbgeschlossen]);

  useEffect(() => {
    const timer = setInterval(() => {
      const einkommen = berechneGesamtPassivEinkommenProSekunde(upgrades, sponsorenAktiv);
      if (einkommen > 0) addPassiveEinnahmen(einkommen);
      aktualisiereHypeVerfall(1);
      aktualisiereZeitstempel();
    }, 1000);
    return () => clearInterval(timer);
  }, [upgrades, sponsorenAktiv, addPassiveEinnahmen, aktualisiereZeitstempel, aktualisiereHypeVerfall]);

  if (!hydrated) return <View style={styles.container} />;
  if (!hatOnboardingAbgeschlossen) return <OnboardingScreen />;
  if (zeigeEinstellungen) return <EinstellungenScreen onClose={() => setZeigeEinstellungen(false)} />;

  const renderScreen = () => {
    switch (currentTab) {
      case 'home': return <HomeScreen onGoToKader={() => setCurrentTab('kader')} />;
      case 'upgrades': return <UpgradeScreen />;
      case 'kader': return <KaderScreen />;
      case 'shop': return <PackScreen />;
      case 'verein': return <VereinScreen />;
      case 'liga': return <LigaScreen />;
      default: return <HomeScreen onGoToKader={() => setCurrentTab('kader')} />;
    }
  };

  return (
    <View style={styles.container}>
      <HeaderDashboard insetsTop={insets.top} onOpenSettings={() => setZeigeEinstellungen(true)} />
      <View style={styles.content}>{renderScreen()}</View>
      <TabBar current={currentTab} onChange={setCurrentTab} insetsBottom={insets.bottom} />
      {offlineBetrag !== null && <OfflinePopup betrag={offlineBetrag} onClose={() => setOfflineBetrag(null)} />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070a13' },
  content: { flex: 1 },
  header: { backgroundColor: '#111622', paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderBottomWidth: 2, borderColor: '#f0b90b33', elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, gap: 8 },
  headerClub: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  headerTitle: { color: '#f0b90b', fontSize: 19, fontWeight: '900' },
  incomePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  headerSubtitle: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },
  settingsBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  tabBar: { flexDirection: 'row', backgroundColor: '#111622', borderTopWidth: 1, borderColor: '#1a2233', paddingTop: 8, flexGrow: 0 },
  tabButton: { width: 68, justifyContent: 'center', alignItems: 'center', gap: 3 },
  tabIconWrap: { width: 38, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  tabIconWrapActive: { backgroundColor: '#f0b90b' },
  tabText: { color: '#4a5568', fontSize: 9, fontWeight: '800' },
  tabTextActive: { color: '#f0b90b' },
  clickerButton: { backgroundColor: '#1e293b', paddingVertical: 30, borderRadius: 26, alignItems: 'center', marginBottom: 18, borderWidth: 3, borderColor: '#f0b90b', overflow: 'hidden' },
  clickerGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#f0b90b22', top: -60 },
  clickerEmoji: { fontSize: 52, marginBottom: 8 },
  clickerText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  clickerValuePill: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  clickerSubText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  clickerBreakdown: { color: '#94a3b8', fontSize: 10, fontWeight: '600', marginTop: 8 },
  clickBarCard: { backgroundColor: '#111622', padding: 15, borderRadius: 16, marginBottom: 18, borderWidth: 1, borderColor: '#1a2233' },
  clickBarLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  clickBarCount: { color: '#38bdf8', fontSize: 13, fontWeight: '800' },
  clickBarContainer: { height: 10, backgroundColor: '#1e293b', borderRadius: 5, width: '100%', overflow: 'hidden' },
  clickBarFill: { height: '100%', backgroundColor: '#22c55e' },
  ligaCard: { backgroundColor: '#111622', padding: 18, borderRadius: 20, marginBottom: 18, borderWidth: 1, borderColor: '#1a2233' },
  relegationCard: { borderColor: '#ef4444' },
  relegationGegner: { color: '#fca5a5', fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  ligaCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, justifyContent: 'center' },
  ligaCardTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#0f172a', padding: 10, borderRadius: 10, marginBottom: 14 },
  teamRatingLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  teamRatingValue: { color: '#f0b90b', fontSize: 18, fontWeight: '900', marginTop: 2 },
  spielBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#22c55e', paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  spielBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  countdownBox: { alignItems: 'center' },
  countdownLabel: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  countdownZeit: { color: '#f0b90b', fontSize: 26, fontWeight: '900', marginTop: 2 },
  warnBox: { alignItems: 'center', gap: 8 },
  warnText: { color: '#fca5a5', fontSize: 13, fontWeight: '800' },
  warnBtn: { backgroundColor: '#f0b90b', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  warnBtnText: { color: '#000', fontSize: 13, fontWeight: '900' },
  homeCard: { backgroundColor: '#111622', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#1a2233' },
  homeCardTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 15 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  statLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '800' },
  toast: { position: 'absolute', top: 10, left: 20, right: 20, backgroundColor: '#22c55e', padding: 14, borderRadius: 12, alignItems: 'center', zIndex: 300, elevation: 10 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617ee', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 400 },
  saisonModal: { backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#334155', borderRadius: 24, padding: 28, alignItems: 'center', gap: 12, width: '100%', maxWidth: 340 },
  saisonModalAufstieg: { borderColor: '#f0b90b' },
  saisonEmoji: { fontSize: 52 },
  saisonText: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  saisonBonus: { color: '#22c55e', fontSize: 15, fontWeight: '900' },
  saisonBtn: { backgroundColor: '#f0b90b', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, marginTop: 6 },
  saisonBtnText: { color: '#000', fontSize: 14, fontWeight: '900' },
  offlineModal: { backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#38bdf8', borderRadius: 24, padding: 28, alignItems: 'center', gap: 12, width: '100%', maxWidth: 340 },
});