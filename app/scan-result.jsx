// import { Pressable, StyleSheet, Text, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { router, useLocalSearchParams } from 'expo-router';
// import { COLORS, RADIUS } from '../constants/theme';

// export default function ScanResultScreen() {
//   const { productNumber, quantity, isNew } = useLocalSearchParams();

//   return (
//     <View style={styles.container}>
//       <View style={styles.check}><Ionicons name="checkmark" size={48} color="#FFF" /></View>
//       <Text style={styles.title}>{isNew === 'true' ? 'Producto registrado' : 'Lectura registrada'}</Text>
//       <Text style={styles.subtitle}>El producto se agregó a la lista y se actualizó la cantidad.</Text>

//       <View style={styles.card}>
//         <View style={styles.icon}><Ionicons name="cube-outline" size={25} color={COLORS.primary} /></View>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.label}>N° de producto</Text>
//           <Text style={styles.number}>{productNumber}</Text>
//         </View>
//         <View>
//           <Text style={styles.label}>Cantidad</Text>
//           <Text style={styles.quantity}>{quantity}</Text>
//         </View>
//       </View>

//       <Pressable style={styles.button} onPress={() => router.replace('/scan')}><Text style={styles.buttonText}>Escanear otro</Text></Pressable>
//       <Pressable style={styles.secondary} onPress={() => router.replace('/(tabs)/products')}><Text style={styles.secondaryText}>Ver lista de productos</Text></Pressable>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 22 },
//   check: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.success, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
//   title: { textAlign: 'center', fontSize: 25, fontWeight: '800', color: COLORS.text, marginTop: 22 },
//   subtitle: { textAlign: 'center', color: COLORS.muted, lineHeight: 21, marginTop: 8, marginBottom: 28 },
//   card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
//   icon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' },
//   label: { color: COLORS.muted, fontSize: 12 },
//   number: { color: COLORS.text, fontWeight: '800', fontSize: 19, marginTop: 3 },
//   quantity: { color: COLORS.text, fontWeight: '800', fontSize: 22, marginTop: 3 },
//   button: { height: 56, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
//   buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
//   secondary: { alignItems: 'center', padding: 18 },
//   secondaryText: { color: COLORS.primary, fontWeight: '700' },
// });


import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS, RADIUS } from "../constants/theme";
import { useTranslation } from "react-i18next";

export default function ScanResultScreen() {
  const { t } = useTranslation();
  const { productNumber, quantity, isNew } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.check}>
        <Ionicons name="checkmark" size={48} color="#FFF" />
      </View>

      <Text style={styles.title}>
        {isNew === "true"
          ? t("scanResult.newProduct")
          : t("scanResult.scanRegistered")}
      </Text>

      <Text style={styles.subtitle}>
        {t("scanResult.subtitle")}
      </Text>

      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons
            name="cube-outline"
            size={25}
            color={COLORS.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>
            {t("scanResult.productNumber")}
          </Text>

          <Text style={styles.number}>
            {productNumber}
          </Text>
        </View>

        <View>
          <Text style={styles.label}>
            {t("scanResult.quantity")}
          </Text>

          <Text style={styles.quantity}>
            {quantity}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => router.replace("/scan")}
      >
        <Text style={styles.buttonText}>
          {t("scanResult.scanAnother")}
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondary}
        onPress={() => router.replace("/(tabs)/products")}
      >
        <Text style={styles.secondaryText}>
          {t("scanResult.viewProducts")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: 22,
  },

  check: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.success,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    textAlign: "center",
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 22,
  },

  subtitle: {
    textAlign: "center",
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 28,
  },

  card: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    color: COLORS.muted,
    fontSize: 12,
  },

  number: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 19,
    marginTop: 3,
  },

  quantity: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 22,
    marginTop: 3,
  },

  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },

  secondary: {
    alignItems: "center",
    padding: 18,
  },

  secondaryText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});