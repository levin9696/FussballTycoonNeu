import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function PackOpeningScreen({ route, navigation }: any) {
  const { packName, player } = route.params;
  const [isOpened, setIsOpened] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const handleOpen = () => {
    setIsOpened(true);
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.overlay}>
      {!isOpened ? (
        // Das große Pack in der Mitte
        <View style={styles.packContainer}>
          <Text style={styles.title}>{packName}</Text>
          <View style={styles.bigPackIcon}>
            <Text style={{ fontSize: 120 }}>🎁</Text>
          </View>
          <TouchableOpacity style={styles.openBtn} onPress={handleOpen}>
            <Text style={styles.btnText}>ÖFFNEN</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Die Karte die aufpoppt
        <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.rating}>{player.rating}</Text>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.nation}>{player.nationality}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>KADER</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', // Dunkler Hintergrund
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  packContainer: { alignItems: 'center' },
  title: { color: '#fff', fontSize: 28, marginBottom: 30, fontWeight: 'bold' },
  bigPackIcon: { 
    width: 280, 
    height: 350, 
    backgroundColor: '#334155', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 30,
    borderWidth: 4,
    borderColor: '#fbbf24'
  },
  openBtn: { backgroundColor: '#fbbf24', paddingHorizontal: 60, paddingVertical: 20, borderRadius: 15 },
  cardContainer: { 
    width: 260, 
    height: 380, 
    backgroundColor: '#1e293b', 
    borderRadius: 20, 
    borderWidth: 5, 
    borderColor: '#fbbf24', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20 
  },
  rating: { color: '#fbbf24', fontSize: 70, fontWeight: '900' },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginVertical: 15 },
  nation: { color: '#94a3b8', fontSize: 18 },
  closeBtn: { marginTop: 30, backgroundColor: '#22c55e', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});