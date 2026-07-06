import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useGameStore, FORMATIONS, FormationType, Player, formatGeld } from '../store/gameStore';
import PlayerCard from '../components/PlayerCard';
import PlayerDetailModal from '../components/PlayerDetailModal';

const RATING_FILTER: { label: string; min: number }[] = [
  { label: 'Alle', min: 0 },
  { label: '42+', min: 42 },
  { label: '68+', min: 68 },
  { label: '95+', min: 95 },
  { label: '140+', min: 140 },
];

export default function KaderScreen() {
  const { kader, formation, aufstellungSlots, setFormation, setzeInSlot, verkaufeSpieler, verkaufeSpielerBulk } = useGameStore();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailSpieler, setDetailSpieler] = useState<Player | null>(null);

  const [auswahlModus, setAuswahlModus] = useState(false);
  const [ausgewaehlteIds, setAusgewaehlteIds] = useState<Set<string>>(new Set());
  const [bestaetigungAktiv, setBestaetigungAktiv] = useState(false);
  const [ratingMin, setRatingMin] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);

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

  const toggleAuswahlModus = () => {
    setAuswahlModus((v) => !v);
    setAusgewaehlteIds(new Set());
    setBestaetigungAktiv(false);
    setSelectedPlayer(null);
  };

  const toggleSpielerAuswahl = (id: string) => {
    setBestaetigungAktiv(false);
    setAusgewaehlteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
        disabled={auswahlModus}
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

  const verfuegbareSpieler = useMemo(() => {
    let liste = kader.filter((p) => !aufgestellteIds.has(p.id) && p.rating >= ratingMin);
    liste = [...liste].sort((a, b) => sortDesc ? b.rating - a.rating : a.rating - b.rating);
    return liste;
  }, [kader, ratingMin, sortDesc, aufstellungSlots]);

  const spielerReihen = chunkArray(verfuegbareSpieler, 3);

  const ausgewaehlteSpieler = kader.filter((p) => ausgewaehlteIds.has(p.id));
  const gesamtwertAuswahl = ausgewaehlteSpieler.reduce((acc, p) => acc + p.rarity.sellPrice, 0);

  const verkaufBestaetigen = () => {
    verkaufeSpielerBulk(Array.from(ausgewaehlteIds));
    setAusgewaehlteIds(new Set());
    setBestaetigungAktiv(false);
    setAuswahlModus(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.formationsBar}>
        {formationsListe.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.formButton, formation === f && styles.activeFormButton]}
            onPress={() => setFormation(f)}
            disabled={auswahlModus}
          >
            <Text style={[styles.formButtonText, formation === f && styles.activeFormButtonText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: auswahlModus ? 110 : 30 }}>
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

        <View style={styles.kaderHeaderRow}>
          <Text style={styles.sectionTitle}>📋 Mein Kader ({kader.length})</Text>
          <TouchableOpacity
            style={[styles.auswahlToggleBtn, auswahlModus && styles.auswahlToggleBtnActive]}
            onPress={toggleAuswahlModus}
          >
            <Text style={[styles.auswahlToggleText, auswahlModus && styles.auswahlToggleTextActive]}>
              {auswahlModus ? '✕ Abbrechen' : '☑ Auswählen'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {RATING_FILTER.map((f) => (
              <TouchableOpacity
                key={f.label}
                style={[styles.filterChip, ratingMin === f.min && styles.filterChipActive]}
                onPress={() => setRatingMin(f.min)}
              >
                <Text style={[styles.filterChipText, ratingMin === f.min && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.sortBtn} onPress={() => setSortDesc((v) => !v)}>
            <Text style={styles.sortBtnText}>Rating {sortDesc ? '▼' : '▲'}</Text>
          </TouchableOpacity>
        </View>

        {selectedPlayer && !auswahlModus && (
          <Text style={styles.infoText}>Wähle jetzt eine freie {selectedPlayer.position} Position auf dem Feld!</Text>
        )}
        {auswahlModus && (
          <Text style={styles.infoText}>Tippe Spieler an, um sie für den Verkauf auszuwählen.</Text>
        )}

        {kader.length === 0 ? (
          <Text style={styles.emptyText}>Du hast noch keine Spieler. Geh in den Shop und kaufe Packs!</Text>
        ) : verfuegbareSpieler.length === 0 ? (
          <Text style={styles.emptyText}>Kein Spieler passt zu diesem Filter.</Text>
        ) : (
          spielerReihen.map((reihe, rIdx) => (
            <View key={rIdx} style={styles.kaderRow}>
              {reihe.map((spieler) => {
                const isSelected = selectedPlayer?.id === spieler.id;
                const istAusgewaehlt = ausgewaehlteIds.has(spieler.id);
                const cardContent = (
                  <PlayerCard
                    player={spieler}
                    size="sm"
                    selected={isSelected}
                    onPress={() => auswahlModus ? toggleSpielerAuswahl(spieler.id) : handlePlayerSelect(spieler)}
                    onLongPress={auswahlModus ? undefined : () => setDetailSpieler(spieler)}
                  />
                );

                return (
                  <View key={spieler.id} style={{ flex: 1, padding: 4, position: 'relative' }}>
                    {isSelected && !auswahlModus ? (
                      <Animated.View style={{ opacity: pulseAnim }}>
                        {cardContent}
                      </Animated.View>
                    ) : (
                      cardContent
                    )}
                    {auswahlModus && (
                      <View style={[styles.checkboxBadge, istAusgewaehlt && styles.checkboxBadgeActive]}>
                        {istAusgewaehlt && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
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

      {auswahlModus && ausgewaehlteIds.size > 0 && (
        <View style={styles.bulkBar}>
          {!bestaetigungAktiv ? (
            <>
              <View style={{ flex: 1 }}>
                <Text style={styles.bulkCount}>{ausgewaehlteIds.size} Spieler ausgewählt</Text>
                <Text style={styles.bulkValue}>Gesamtwert: {formatGeld(gesamtwertAuswahl)}</Text>
              </View>
              <TouchableOpacity style={styles.bulkSellBtn} onPress={() => setBestaetigungAktiv(true)}>
                <Text style={styles.bulkSellBtnText}>Verkaufen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.bulkConfirmText}>{ausgewaehlteIds.size} Spieler für {formatGeld(gesamtwertAuswahl)} verkaufen?</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.bulkCancelBtn} onPress={() => setBestaetigungAktiv(false)}>
                  <Text style={styles.bulkCancelBtnText}>Nein</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bulkSellBtn} onPress={verkaufBestaetigen}>
                  <Text style={styles.bulkSellBtnText}>Ja, verkaufen</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

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

  kaderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 15, marginTop: 15, marginBottom: 5 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  auswahlToggleBtn: { backgroundColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  auswahlToggleBtnActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  auswahlToggleText: { color: '#cbd5e1', fontSize: 12, fontWeight: '800' },
  auswahlToggleTextActive: { color: '#fff' },

  filterRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginBottom: 10, gap: 8 },
  filterChip: { backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#f0b90b', borderColor: '#f0b90b' },
  filterChipText: { color: '#94a3b8', fontSize: 11, fontWeight: '800' },
  filterChipTextActive: { color: '#000' },
  sortBtn: { backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginLeft: 'auto' },
  sortBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },

  infoText: { color: '#38bdf8', fontSize: 13, fontWeight: '700', marginHorizontal: 15, marginBottom: 10 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 20, marginHorizontal: 20 },
  kaderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 8 },

  checkboxBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#00000088', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  checkboxBadgeActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkboxCheck: { color: '#fff', fontSize: 13, fontWeight: '900' },

  bulkBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#0f172a', borderTopWidth: 2, borderColor: '#f0b90b', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  bulkCount: { color: '#fff', fontSize: 13, fontWeight: '900' },
  bulkValue: { color: '#22c55e', fontSize: 13, fontWeight: '800', marginTop: 2 },
  bulkConfirmText: { color: '#fca5a5', fontSize: 12, fontWeight: '700', flex: 1 },
  bulkSellBtn: { backgroundColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  bulkSellBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  bulkCancelBtn: { backgroundColor: '#334155', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  bulkCancelBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: '800' },
});