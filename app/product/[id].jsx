import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { db } from '../../lib/firebase';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'products', String(id))).then((snap) => {
      if (snap.exists()) setProduct(snap.data());
    }).catch(console.log);
  }, [id]);

  if (!product) return <View style={styles.center}><Text>Cargando producto...</Text></View>;

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </Pressable>
      <View style={styles.hero}>
        <View style={styles.icon}><Ionicons name="cube-outline" size={42} color={COLORS.primary} /></View>
        <Text style={styles.number}>{product.productNumber}</Text>
        <Text style={styles.label}>N° de producto</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Cantidad leída</Text>
        <Text style={styles.quantity}>{product.quantity}</Text>
      </View>
      <Pressable style={styles.button} onPress={() => router.replace('/scan')}>
        <Text style={styles.buttonText}>Escanear de nuevo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 22, paddingTop: 58 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: 30, marginBottom: 28 },
  icon: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 30, fontWeight: '800', color: COLORS.text, marginTop: 16 },
  label: { color: COLORS.muted, marginTop: 4 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 22 },
  quantity: { fontSize: 42, fontWeight: '800', color: COLORS.text, marginTop: 6 },
  button: { height: 56, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
