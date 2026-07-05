import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { useGameStore, generateRandomPlayer, Player, PACKS, RARITY_INTERVALS, getPackPreis, formatGeld } from '../store/gameStore';
import { LIGEN_ORDNUNG } from '../utils/ligaSystem';
import PlayerCard from '../components/PlayerCard';
import { getGradientBackgroundStyle, getGlowShadowStyle } from '../utils/rarityDesign';

const PACK_DESIGN = [
  { colors: ['#8a5a3a', '#4a2f1a'], glow: '#8a5a3a', angle: 135 },
  { colors: ['#a5673f', '#54331c'], glow: '#a5673f', angle: 135 },
  { colors: ['#cd7f32', '#7a4a1a'], glow: '#cd7f32', angle: 135 },
  { colors: ['#c0c0c0', '#6e6e6e'], glow: '#c0c0c0', angle: 135 },
  { colors: ['#ffd700', '#a87b00'], glow: '#ffd700', angle: 135 },
  { colors: ['#7dc4ff', '#1a3d7c'], glow: '#7dc4ff', angle: 135 },
  { colors: ['#ff6b5b', '#8a1f13'], glow: '#ff6b5b', angle: 135 },
  { colors: ['#c158dc', '#4a1266'], glow: '#c158dc', angle: 135 },
  { colors: ['#4a9eff', '#0a1a3c'], glow: '#4a9eff', angle: 135 },
  { colors: ['#ff9f4a', '#7c3a0a'], glow: '#ff9f4a', angle: 135 },
  { colors: ['#e63946', '#5c0f14'], glow: '#e63946', angle: 135 },
  { colors: ['#ff6b6b', '#ffd166', '#6bffb8'], glow: '#ff6b6b', angle: 120 },
  { colors: ['#6bc1ff', '#0a1a5c'], glow: '#6bc1ff', angle: 135 },
  { colors: ['#fff6c8', '#c99400'], glow: '#ffd700', angle: 120 },
  { colors: ['#c16bff', '#2a0a5c'], glow: '#c16bff', angle: 135 },
  { colors: ['#ffffff', '#c9d6e3', '#ffd700'], glow: '#ffffff', angle: 120 },
  { colors: ['#ffd700', '#ffffff', '#ffd700'], glow: '#ffd700', angle: 110 },
  { colors: ['#ffffff', '#e3e3e3', '#ffffff'], glow: '#ffffff', angle: 100 },
];

const getPackGradientStyle = (design: typeof PACK_DESIGN[0]): any => {
  if (Platform.OS === 'web') return { backgroundImage: `linear-gradient(${design.angle}deg, ${design.colors.join(', ')})` };
  return { backgroundColor: design.colors[Math.floor(design.colors.length / 2)] };
};

type Phase = 'idle' | 'shaking' | 'flash' | 'reveal';

export default function PackScreen() {
  const { geld, aktuelleLigaIndex, packKaeufe, addPlayerToKader, kaufePack } = useGameStore();
  const [gezogenerSpieler, setGezogenerSpieler] = useState<Omit<Player, 'id'> | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [aktivesPackIdx, setAktivesPackIdx] = useState<number | null>(null);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.6)).current;
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const packBounce = useRef(new Animated.Value(0)).current;

  const kaufeUndZeigePack = (index: number) => {
    const pack = PACKS[index];
    if (aktuelleLigaIndex < pack.ligaIndex) { alert(`Dieses Pack schaltet sich erst in der Liga "${LIGEN_ORDNUNG[pack.ligaIndex]}" frei!`); return; }
    const erfolg = kaufePack(pack.id);
    if (!erfolg) { alert('Nicht genug Geld!'); return; }

    setAktivesPackIdx(index);
    setGezogenerSpieler(null);
    setIsRevealing(true);
    setPhase('idle');
    flipAnim.setValue(0); flashAnim.setValue(0); cardScale.setValue(0.3); packBounce.setValue(0);

    Animated.loop(Animated.sequence([
      Animated.timing(packBounce, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(packBounce, { toValue: 0, duration: 900, useNativeDriver: true }),
    ])).start();
  };

  const runShakeLoop = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 90, useNativeDriver: true }),
    ]).start();
  };

  const oeffnePack = () => {
    if (aktivesPackIdx === null) return;
    const pack = PACKS[aktivesPackIdx];
    packBounce.stopAnimation();
    setPhase('shaking');

    const rand = Math.random() * 100;
    let sum = 0; let gewaehlteRarityIdx = 0;
    for (let i = 0; i < pack.chances.length; i++) { sum += pack.chances[i]; if (rand <= sum) { gewaehlteRarityIdx = i; break; } }
    const interval = RARITY_INTERVALS[gewaehlteRarityIdx];
    const finalMin = Math.max(pack.min, interval.min);
    const finalMax = Math.min(pack.max, interval.max);
    const ausgewuerfeltesRating = Math.floor(Math.random() * (finalMax - finalMin + 1)) + finalMin;
    const spieler = generateRandomPlayer(ausgewuerfeltesRating);

    runShakeLoop();
    setTimeout(runShakeLoop, 350);

    setTimeout(() => {
      setPhase('flash');
      addPlayerToKader(spieler);
      setGezogenerSpieler(spieler);
      Animated.timing(flashAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start(() => {
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      });
      setTimeout(() => {
        setPhase('reveal');
        Animated.parallel([
          Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
          Animated.timing(flipAnim, { toValue: 180, duration: 550, useNativeDriver: true }),
        ]).start();
        Animated.loop(Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        ])).start();
      }, 150);
    }, 900);
  };

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: [1, 0] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: [0, 1] });
  const shakeRotate = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });
  const bounceTranslate = packBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const frontAnimatedStyle = { transform: [{ scaleX: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ scaleX: backInterpolate }, { scale: cardScale }] };

  const closeReveal = () => { setIsRevealing(false); setAktivesPackIdx(null); glowPulse.stopAnimation(); };
  const isHighRarity = gezogenerSpieler && gezogenerSpieler.rating >= 95;
  const aktivesPackDesign = aktivesPackIdx !== null ? PACK_DESIGN[aktivesPackIdx] : null;
  const aktivesPackConfig = aktivesPackIdx !== null ? PACKS[aktivesPackIdx] : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🃏 PACK-OPENING SHOP</Text>
        <Text style={styles.money}>Budget: {formatGeld(geld)}</Text>
      </View>

      {isRevealing && (
        <View style={styles.revealArea}>
          <Animated.View pointerEvents="none" style={[styles.flashOverlay, { opacity: flashAnim }]} />
          {phase === 'reveal' && gezogenerSpieler && (
            <Animated.View pointerEvents="none" style={[styles.glowRing, { backgroundColor: gezogenerSpieler.rarity.color, opacity: glowPulse, transform: [{ scale: glowPulse }] }]} />
          )}
          {phase === 'reveal' && isHighRarity && (
            <>
              <Text style={[styles.sparkle, { top: '15%', left: '20%' }]}>✨</Text>
              <Text style={[styles.sparkle, { top: '20%', right: '18%' }]}>✨</Text>
              <Text style={[styles.sparkle, { bottom: '25%', left: '15%' }]}>✨</Text>
              <Text style={[styles.sparkle, { bottom: '20%', right: '20%' }]}>⭐</Text>
            </>
          )}
          <View style={styles.cardContainer}>
            {phase === 'idle' && aktivesPackDesign && aktivesPackConfig && (
              <Animated.View style={[styles.idlePack, { transform: [{ translateY: bounceTranslate }] }]}>
                <View style={[styles.idlePackInner, getPackGradientStyle(aktivesPackDesign), getGlowShadowStyle(aktivesPackDesign.glow, 18)]}>
                  <View style={styles.packShine} pointerEvents="none" />
                  <Text style={{ fontSize: 60 }}>{aktivesPackConfig.emoji}</Text>
                  <Text style={styles.idlePackName}>{aktivesPackConfig.name}</Text>
                </View>
              </Animated.View>
            )}
            {phase === 'shaking' && (
              <Animated.View style={[styles.packShake, { transform: [{ rotate: shakeRotate }] }]}>
                <Text style={{ fontSize: 70 }}>📦</Text>
                <Text style={styles.cardFrontText}>Pack wird geöffnet...</Text>
              </Animated.View>
            )}
            {(phase === 'flash' || phase === 'reveal') && (
              <>
                <Animated.View style={[styles.flipCard, frontAnimatedStyle, styles.cardFront]}><Text style={{ fontSize: 50 }}>📦</Text></Animated.View>
                {gezogenerSpieler && <Animated.View style={[styles.flipCard, backAnimatedStyle]}><PlayerCard player={gezogenerSpieler} size="lg" /></Animated.View>}
              </>
            )}
          </View>
          {phase === 'idle' && (
            <View style={styles.idleButtonRow}>
              <TouchableOpacity style={styles.oeffnenBtn} onPress={oeffnePack}><Text style={styles.oeffnenBtnText}>📦 Pack öffnen</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeReveal}><Text style={styles.cancelBtnText}>Später öffnen</Text></TouchableOpacity>
            </View>
          )}
          {phase === 'reveal' && <TouchableOpacity style={styles.closeRevealBtn} onPress={closeReveal}><Text style={styles.closeRevealBtnText}>✔ Bestätigen</Text></TouchableOpacity>}
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15 }}>
        <Text style={styles.sectionTitle}>Verfügbare Packs ({PACKS.length} Stück)</Text>
        <View style={styles.packGrid}>
          {PACKS.map((pack, index) => {
            const design = PACK_DESIGN[index];
            const isLocked = aktuelleLigaIndex < pack.ligaIndex;
            const anzahlGekauft = packKaeufe[pack.id] || 0;
            const preis = getPackPreis(pack, anzahlGekauft);
            return (
              <TouchableOpacity key={pack.id} style={styles.packTile} onPress={() => kaufeUndZeigePack(index)} activeOpacity={0.85}>
                <View style={[styles.packTileInner, getPackGradientStyle(design), getGlowShadowStyle(design.glow, 10), isLocked && styles.packTileLocked]}>
                  <View style={styles.packShine} pointerEvents="none" />
                  <Text style={styles.packEmoji}>{pack.emoji}</Text>
                  <Text style={styles.packNameText}>{pack.name}</Text>
                  <Text style={styles.packMetaText}>Rating {pack.min}-{pack.max}</Text>
                  {anzahlGekauft > 0 && !isLocked && <Text style={styles.packKaufText}>{anzahlGekauft}x gekauft</Text>}
                  {isLocked ? (
                    <View style={styles.lockBadge}><Text style={styles.lockBadgeText}>🔒 ab {LIGEN_ORDNUNG[pack.ligaIndex]}</Text></View>
                  ) : (
                    <View style={styles.priceBadge}><Text style={styles.priceBadgeText}>{formatGeld(preis)}</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 20, backgroundColor: '#0f172a', alignItems: 'center', borderBottomWidth: 1, borderColor: '#1e293b' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  money: { color: '#22c55e', fontSize: 18, fontWeight: '800', marginTop: 4 },
  sectionTitle: { color: '#64748b', fontSize: 13, fontWeight: '800', marginBottom: 15, letterSpacing: 0.5 },
  packGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  packTile: { width: '48%', marginBottom: 14 },
  packTileInner: { borderRadius: 18, height: 172, alignItems: 'center', justifyContent: 'center', padding: 10, borderWidth: 2, borderColor: '#ffffff33', overflow: 'hidden', position: 'relative' },
  packTileLocked: { opacity: 0.4 },
  packShine: { position: 'absolute', width: '50%', height: '220%', backgroundColor: '#ffffff22', top: '-60%', left: '-15%', transform: [{ rotate: '25deg' }] },
  packEmoji: { fontSize: 34, marginBottom: 4 },
  packNameText: { color: '#fff', fontSize: 14, fontWeight: '900', textShadowColor: '#00000088', textShadowRadius: 4, textAlign: 'center' },
  packMetaText: { color: '#ffffffcc', fontSize: 11, fontWeight: '700', marginTop: 2 },
  packKaufText: { color: '#ffffffaa', fontSize: 9, fontWeight: '700', marginTop: 2 },
  priceBadge: { backgroundColor: '#00000066', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  priceBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  lockBadge: { backgroundColor: '#00000088', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  lockBadgeText: { color: '#fca5a5', fontSize: 9, fontWeight: '800' },
  revealArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617f0', zIndex: 99, justifyContent: 'center', alignItems: 'center' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff' },
  glowRing: { position: 'absolute', width: 280, height: 280, borderRadius: 140, opacity: 0.35 },
  sparkle: { position: 'absolute', fontSize: 26 },
  cardContainer: { width: 230, height: 330, alignItems: 'center', justifyContent: 'center' },
  idlePack: { width: 200, height: 260, alignItems: 'center', justifyContent: 'center' },
  idlePackInner: { width: 200, height: 260, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ffffff55', overflow: 'hidden', position: 'relative' },
  idlePackName: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 10, textShadowColor: '#00000088', textShadowRadius: 4, textAlign: 'center', paddingHorizontal: 10 },
  packShake: { alignItems: 'center', justifyContent: 'center' },
  cardFrontText: { color: '#94a3b8', fontSize: 14, fontWeight: '800', marginTop: 10 },
  flipCard: { width: 230, height: 330, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'absolute', backfaceVisibility: 'hidden' },
  cardFront: { backgroundColor: '#1e293b', borderWidth: 3, borderColor: '#475569' },
  idleButtonRow: { marginTop: 26, alignItems: 'center', gap: 10 },
  oeffnenBtn: { backgroundColor: '#f0b90b', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 12 },
  oeffnenBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  cancelBtnText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  closeRevealBtn: { marginTop: 24, backgroundColor: '#22c55e', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  closeRevealBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});