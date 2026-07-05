import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useGameStore, FORMATIONS, FormationType, Player } from '../store/gameStore';
import PlayerCard from '../components/PlayerCard';
import PlayerDetailModal from '../components/PlayerDetailModal';

export default function KaderScreen() {
  const { kader, formation, aufstellungSlots, setFormation, setzeInSlot, verkaufeSpieler } = useGameStore();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailSpieler, setDetailSpieler] = useState<Player | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selectedPlayer) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [selectedPlayer]);

  const handlePlayerSelect = (player: Player) => {
    if (selectedPlayer?.id === player.id) {
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer(player);
    }
  };

  const handleSlotPress = (slotId: string, positionType: 'ST' | 'MF' | 'DF' | 'TW') => {
    if (selectedPlayer) {
      if (selectedPlayer.position !== positionType) {
        alert(`Dieser Spieler ist ein ${selectedPlayer.position} und kann nicht auf ${positionType} spielen!`);
        return;
      }
      setzeInSlot(slotId, selectedPlayer);
      setSelectedPlayer(null);
    } else {
      if (aufstellungSlots[slotId]) {
        setzeInSlot(slotId, null);
      }
    }
  };

  const currentFormConfig = FORMATIONS[formation];
  const formationsListe: FormationType[] = ['4-3-3', '4-4-2', '3-4-3', '3-5-2', '5-3-2'];

  const renderFieldSlot = (slotId: string, positionType: 'ST' | 'MF' | 'DF' | 'TW') => {
    const spielerImSlot = aufstellungSlots[slotId];
    return (
      <TouchableOpacity
        key={slotId}
        style={[styles.fieldSlot, spielerImSlot && { borderColor: spielerImSlot.rarity.color, backgroundColor: '#0f172a' }]}
        onPress={() => handleSlotPress(slotId, positionType)}
      >
        {spielerImSlot ? (
          <>
            <Text style={styles.slotRating}>{spielerImSlot.rating}</Text>
            <Text style={styles.slotName} numberOfLines={1}>{spielerImSlot.flag} {spielerImSlot.name}</Text>
          </>
        ) : (
          <Text style={styles.slotPlaceholder}>{positionType}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const chunkArray = (arr: Player[], size: number) => {
    const result: Player[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const aufgestellteIds = new Set(
    Object.values(aufstellungSlots).filter(Boolean).map((p) => (p as Player).id)
  );
  const verfuegbareSpieler = kader.filter((p) => !aufgestellteIds.has(p.id));
  const spielerReihen = chunkArray(verfuegbareSpieler, 3);

  return (
    <View style={styles.container}>
      <View style={styles.formationsBar}>
        {formationsListe.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.formButton, formation === f && styles.activeFormButton]}
            onPress={() => setFormation(f)}
          >
            <Text style={[styles.formButtonText, formation === f && styles.activeFormButtonText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.pitchContainer}>
          <View style={styles.pitchField}>
            <View style={styles.pitchCenterLine} />
            <View style={styles.pitchCenterCircle} />
            <View style={styles.pitchPenaltyArea} />

            <View style={styles.pitchRow}>
              {currentFormConfig.ST.map((id) => renderFieldSlot(id, 'ST'))}
            </View>
            <View style={styles.pitchRow}>
              {currentFormConfig.MF.map((id) => renderFieldSlot(id, 'MF'))}
            </View>
            <View style={styles.pitchRow}>
              {currentFormConfig.DF.map((id) => renderFieldSlot(id, 'DF'))}
            </View>
            <View style={styles.pitchRow}>
              {renderFieldSlot('TW1', 'TW')}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📋 Mein Kader ({kader.length})</Text>
        {selectedPlayer && (
          <Text style={styles.infoText}>Wähle jetzt eine freie {selectedPlayer.position} Position auf dem Feld!</Text>
        )}

        {kader.length === 0 ? (
          <Text style={styles.emptyText}>Du hast noch keine Spieler. Geh in den Shop und kaufe Packs!</Text>
        ) : verfuegbareSpieler.length === 0 ? (
          <Text style={styles.emptyText}>Alle deine Spieler sind bereits aufgestellt. 👍</Text>
        ) : (
          spielerReihen.map((reihe, rIdx) => (
            <View key={rIdx} style={styles.kaderRow}>
              {reihe.map((spieler) => {
                const isSelected = selectedPlayer?.id === spieler.id;
                const cardContent = (
                  <PlayerCard
                    player={spieler}
                    size="sm"
                    selected={isSelected}
                    onPress={() => handlePlayerSelect(spieler)}
                    onLongPress={() => setDetailSpieler(spieler)}
                  />
                );

                return (
                  <View key={spieler.id} style={{ flex: 1, padding: 4 }}>
                    {isSelected ? (
                      <Animated.View style={{ opacity: pulseAnim }}>
                        {cardContent}
                      </Animated.View>
                    ) : (
                      cardContent
                    )}
                  </View>
                );
              })}
              {reihe.length < 3 && Array.from({ length: 3 - reihe.length }).map((_, i) => (
                <View key={`empty-${i}`} style={{ flex: 1, padding: 4 }} />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <PlayerDetailModal
        player={detailSpieler}
        onClose={() => setDetailSpieler(null)}
        onVerkaufen={verkaufeSpieler}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  formationsBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#0f172a', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#1e293b' },
  formButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#1e293b' },
  activeFormButton: { backgroundColor: '#f0b90b' },
  formButtonText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  activeFormButtonText: { color: '#000' },

  pitchContainer: { padding: 15, alignItems: 'center' },
  pitchField: { width: '100%', height: 380, backgroundColor: '#15803d', borderRadius: 16, borderWidth: 3, borderColor: '#ffffffcc', paddingVertical: 10, justifyContent: 'space-between', position: 'relative', overflow: 'hidden' },
  pitchCenterLine: { position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: '#ffffff66' },
  pitchCenterCircle: { position: 'absolute', top: '40%', left: '35%', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#ffffff66' },
  pitchPenaltyArea: { position: 'absolute', bottom: 0, left: '20%', width: '60%', height: 60, borderWidth: 2, borderColor: '#ffffff66', borderBottomWidth: 0 },
  pitchRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 10 },

  fieldSlot: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#166534', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  slotPlaceholder: { color: '#ffffff88', fontSize: 12, fontWeight: '900' },
  slotRating: { color: '#fff', fontSize: 16, fontWeight: '900' },
  slotName: { color: '#cbd5e1', fontSize: 9, fontWeight: '700', width: '90%', textAlign: 'center' },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginHorizontal: 15, marginTop: 15, marginBottom: 5 },
  infoText: { color: '#38bdf8', fontSize: 13, fontWeight: '700', marginHorizontal: 15, marginBottom: 10 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 20, marginHorizontal: 20 },
  kaderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 8 },
});