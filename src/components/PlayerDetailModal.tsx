import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Player } from '../store/gameStore';
import PlayerCard from './PlayerCard';

interface Props {
  player: Player | null;
  onClose: () => void;
  onVerkaufen: (id: string, preis: number) => void;
}

export default function PlayerDetailModal({ player, onClose, onVerkaufen }: Props) {
  const [bestaetigungAktiv, setBestaetigungAktiv] = useState(false);

  if (!player) return null;

  const verkaufBestaetigt = () => {
    onVerkaufen(player.id, player.rarity.sellPrice);
    setBestaetigungAktiv(false);
    onClose();
  };

  const schliessen = () => {
    setBestaetigungAktiv(false);
    onClose();
  };

  return (
    <Modal visible={!!player} transparent animationType="fade" onRequestClose={schliessen}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={schliessen} activeOpacity={1} />
        <View style={styles.content}>
          <PlayerCard player={player} size="lg" />

          {!bestaetigungAktiv ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.sellBtn} onPress={() => setBestaetigungAktiv(true)}>
                <Text style={styles.sellBtnText}>💵 Für {player.rarity.sellPrice.toLocaleString()} € verkaufen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={schliessen}>
                <Text style={styles.closeBtnText}>Schließen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>Wirklich verkaufen? Das kann nicht rückgängig gemacht werden!</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.confirmYesBtn} onPress={verkaufBestaetigt}>
                  <Text style={styles.sellBtnText}>✔ Ja, verkaufen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setBestaetigungAktiv(false)}>
                  <Text style={styles.closeBtnText}>Abbrechen</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617dd' },
  content: { alignItems: 'center', gap: 16 },
  buttonRow: { gap: 10, width: 260 },
  sellBtn: { backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sellBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  closeBtn: { backgroundColor: '#334155', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: '800' },
  confirmBox: { backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#ef4444', borderRadius: 14, padding: 16, alignItems: 'center', gap: 12, width: 260 },
  confirmText: { color: '#fca5a5', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  confirmYesBtn: { backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
});