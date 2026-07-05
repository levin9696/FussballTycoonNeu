import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Player } from '../store/gameStore';
import { getRarityDesign, getGradientBackgroundStyle, getGlowShadowStyle } from '../utils/rarityDesign';

interface PlayerCardProps {
  player: Omit<Player, 'id'> & { id?: string };
  size?: 'sm' | 'lg';
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
}

export default function PlayerCard({ player, size = 'sm', onPress, onLongPress, selected }: PlayerCardProps) {
  const design = getRarityDesign(player.rarity.name);
  const isLarge = size === 'lg';

  const cardContent = (
    <View
      style={[
        isLarge ? styles.cardLg : styles.cardSm,
        getGradientBackgroundStyle(design),
        getGlowShadowStyle(design.glow, isLarge ? 20 : 8),
        selected && styles.selectedBorder,
      ]}
    >
      <View pointerEvents="none" style={[styles.shineStripe, isLarge && styles.shineStripeLg]} />

      <View style={[styles.rarityBadge, isLarge && styles.rarityBadgeLg]}>
        <Text style={[styles.rarityBadgeText, { color: design.textColor }]}>
          {player.rarity.name.toUpperCase()}
        </Text>
      </View>

      <View style={isLarge ? styles.ratingBlockLg : styles.ratingBlockSm}>
        <Text style={[isLarge ? styles.ratingLg : styles.ratingSm, { color: design.textColor }]}>
          {player.rating}
        </Text>
        <Text style={[isLarge ? styles.positionLg : styles.positionSm, { color: design.textColor }]}>
          {player.position}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: design.textColor + '55' }]} />

      <Text style={[isLarge ? styles.nameLg : styles.nameSm, { color: design.textColor }]} numberOfLines={1}>
        {player.flag} {player.name}
      </Text>
      {isLarge && (
        <Text style={[styles.countryLg, { color: design.textColor + 'cc' }]}>{player.country}</Text>
      )}
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity onPress={onPress} onLongPress={onLongPress} delayLongPress={350}>
        {cardContent}
      </TouchableOpacity>
    );
  }
  return cardContent;
}

const styles = StyleSheet.create({
  cardSm: {
    borderRadius: 14, padding: 10, height: 140, justifyContent: 'space-between', alignItems: 'center',
    overflow: 'hidden', borderWidth: 2, borderColor: '#ffffff33',
  },
  cardLg: {
    width: 230, height: 330, borderRadius: 22, padding: 18, justifyContent: 'flex-start', alignItems: 'center',
    overflow: 'hidden', borderWidth: 3, borderColor: '#ffffff55',
  },
  selectedBorder: { borderColor: '#38bdf8', borderWidth: 3 },

  shineStripe: {
    position: 'absolute', width: '60%', height: '220%', backgroundColor: '#ffffff22',
    top: '-60%', left: '-10%', transform: [{ rotate: '25deg' }],
  },
  shineStripeLg: { width: '45%' },

  rarityBadge: { backgroundColor: '#00000055', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 2 },
  rarityBadgeLg: { paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  rarityBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  ratingBlockSm: { alignItems: 'center' },
  ratingBlockLg: { alignItems: 'center', marginBottom: 6 },
  ratingSm: { fontSize: 24, fontWeight: '900' },
  ratingLg: { fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  positionSm: { fontSize: 10, fontWeight: '800', opacity: 0.85 },
  positionLg: { fontSize: 16, fontWeight: '800', opacity: 0.9, marginTop: -6 },

  divider: { width: '70%', height: 1, marginVertical: 6 },

  nameSm: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  nameLg: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  countryLg: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});