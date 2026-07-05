import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';

interface PackCardProps {
  tier: any;
  index: number;
  onPress: () => void;
  color: string;
  isRainbow: boolean;
  hasHeavyGlow: boolean;
}

export default function PackCard({ tier, index, onPress, color, isRainbow, hasHeavyGlow }: PackCardProps) {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRainbow) {
      Animated.loop(
        Animated.timing(colorAnim, { toValue: 1, duration: 3000, useNativeDriver: false })
      ).start();
    }

    if (hasHeavyGlow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false })
        ])
      ).start();
    }
  }, [isRainbow, hasHeavyGlow]);

  const rainbowColor = colorAnim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#ff0000']
  });

  const currentColor = isRainbow ? rainbowColor : color;

  const animatedShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.0]
  });

  const animatedShadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 22]
  });

  const formattedPrice = tier.cost >= 1000000 
    ? `${(tier.cost / 1000000).toFixed(1)}M €` 
    : `${tier.cost.toLocaleString()} €`;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Animated.View style={[
        styles.card, 
        { 
          borderColor: currentColor, 
          shadowColor: currentColor,
          shadowOpacity: hasHeavyGlow ? animatedShadowOpacity : 0.4,
          shadowRadius: hasHeavyGlow ? animatedShadowRadius : 8,
          elevation: hasHeavyGlow ? 18 : 5,
          borderWidth: hasHeavyGlow ? 3 : 2,
        }
      ]}>
        
        {/* DER GANZE BALKEN-HINTERGRUND: Füllt jetzt die komplette Karte aus */}
        <Animated.View style={[styles.fullCardTint, { backgroundColor: isRainbow ? '#ff00ff' : color }]} />

        {/* Content-Elemente (wichtig: zIndex sorgt dafür, dass sie über der Farbe liegen) */}
        <View style={styles.artContainer}>
          <Text style={styles.emoji}>{tier.emoji || '📦'}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.packName}>
            {tier.name.toUpperCase()} {hasHeavyGlow ? '👑' : ''}
          </Text>
          <Text style={styles.packRating}>GES: {tier.min}-{tier.max}</Text>
        </View>

        <View style={[
          styles.button, 
          { 
            backgroundColor: isRainbow ? '#ff00ff' : color,
            shadowColor: isRainbow ? '#ff00ff' : color,
          }
        ]}>
          <Text style={styles.buttonText}>{formattedPrice}</Text>
        </View>

      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 12, marginBottom: 12 },
  card: {
    backgroundColor: '#111622', borderRadius: 14, padding: 14, flexDirection: 'row',
    alignItems: 'center', position: 'relative', overflow: 'hidden', shadowOffset: { width: 0, height: 0 },
  },
  // JETZT NEU: Geht über die gesamte Breite und Höhe der Pack-Leiste
  fullCardTint: { 
    position: 'absolute', 
    left: 0, top: 0, right: 0, bottom: 0,
    opacity: 0.07, // Dezent genug, um sich perfekt mit dem dunklen Hintergrund zu vermischen
  },
  artContainer: { backgroundColor: '#1a2233', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#2d3748', zIndex: 2 },
  emoji: { fontSize: 30 },
  infoContainer: { flex: 1, marginLeft: 14, zIndex: 2 },
  packName: { color: '#ffffff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  packRating: {
    color: '#a0aec0', fontSize: 11, fontWeight: '700', marginTop: 4,
    backgroundColor: '#1a2233', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4
  },
  button: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 90, zIndex: 2,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 6
  },
  buttonText: { color: '#000', fontSize: 12, fontWeight: '900' }
});