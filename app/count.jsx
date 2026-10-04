// import React, { useEffect, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import { router } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { COLORS, RADIUS } from "../constants/theme";
// import { useAuth } from "../context/AuthContext";
// import {
//   adjustCountItem,
//   removeCountItem,
//   subscribeToCount,
// } from "../services/countService";

// export default function CountScreen() {
//   const { user } = useAuth();
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!user?.uid) return undefined;

//     const unsubscribe = subscribeToCount(
//       user.uid,
//       (data) => {
//         setItems(data);
//         setError(null);
//         setLoading(false);
//       },
//       (err) => {
//         console.error("Error al cargar la lista:", err);
//         setError("No se pudo cargar la lista.");
//         setLoading(false);
//       },
//     );

//     return unsubscribe;
//   }, [user?.uid]);

//   const totals = useMemo(
//     () => ({
//       products: items.length,
//       units: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
//     }),
//     [items],
//   );

//   const handleAdjust = async (item, delta) => {
//     try {
//       await adjustCountItem(user.uid, item.id, delta);
//     } catch (err) {
//       console.error("Error al ajustar la cantidad:", err);
//       Alert.alert("Error", "No se pudo actualizar la cantidad.");
//     }
//   };

//   const handleRemove = (item) => {
//     Alert.alert(
//       "Eliminar de la lista",
//       `¿Quitar ${item.productNumber} de tu lista?`,
//       [
//         { text: "Cancelar", style: "cancel" },
//         {
//           text: "Eliminar",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await removeCountItem(user.uid, item.id);
//             } catch (err) {
//               console.error("Error al eliminar:", err);
//               Alert.alert("Error", "No se pudo eliminar el renglón.");
//             }
//           },
//         },
//       ],
//     );
//   };

//   const renderItem = ({ item }) => (
//     <View style={styles.row}>
//       <Pressable
//         style={styles.rowInfo}
//         onPress={() =>
//           router.push({ pathname: "/product-form", params: { id: item.id } })
//         }
//       >
//         <Text style={styles.rowTitle} numberOfLines={1}>
//           {item.productNumber}
//         </Text>
//         <Text style={styles.rowSubtitle}>Tocá para ver la ficha</Text>
//       </Pressable>

//       <View style={styles.counter}>
//         <Pressable
//           style={styles.counterButton}
//           onPress={() => handleAdjust(item, -1)}
//         >
//           <Ionicons name="remove" size={20} color={COLORS.primary} />
//         </Pressable>
//         <Text style={styles.quantity}>{item.quantity}</Text>
//         <Pressable
//           style={styles.counterButton}
//           onPress={() => handleAdjust(item, 1)}
//         >
//           <Ionicons name="add" size={20} color={COLORS.primary} />
//         </Pressable>
//       </View>

//       <Pressable style={styles.deleteButton} onPress={() => handleRemove(item)}>
//         <Ionicons name="trash-outline" size={20} color="#B42318" />
//       </Pressable>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons name="chevron-back" size={26} color={COLORS.text} />
//         </Pressable>
//         <Text style={styles.title}>Mi lista de hoy</Text>
//       </View>

//       <View style={styles.summary}>
//         <View style={styles.summaryBlock}>
//           <Text style={styles.summaryValue}>{totals.units}</Text>
//           <Text style={styles.summaryLabel}>Total leído</Text>
//         </View>
//         <View style={styles.summaryBlock}>
//           <Text style={styles.summaryValue}>{totals.products}</Text>
//           <Text style={styles.summaryLabel}>Productos distintos</Text>
//         </View>
//       </View>

//       {loading ? (
//         <View style={styles.center}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//         </View>
//       ) : error ? (
//         <View style={styles.center}>
//           <Text style={styles.emptyText}>{error}</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={items}
//           keyExtractor={(item) => item.id}
//           renderItem={renderItem}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={
//             <Text style={styles.emptyText}>
//               Todavía no leíste ningún código hoy.
//             </Text>
//           }
//         />
//       )}

//       <Pressable style={styles.scanButton} onPress={() => router.back()}>
//         <Ionicons name="scan" size={20} color="#FFF" />
//         <Text style={styles.scanButtonText}>Seguir escaneando</Text>
//       </Pressable>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     paddingTop: 60,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     marginBottom: 12,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 8,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: COLORS.text,
//   },
//   summary: {
//     flexDirection: "row",
//     marginHorizontal: 16,
//     marginBottom: 12,
//     backgroundColor: "#FFF",
//     borderRadius: RADIUS.md,
//     borderWidth: 1,
//     borderColor: "#D0D5DD",
//     paddingVertical: 12,
//   },
//   summaryBlock: {
//     flex: 1,
//     alignItems: "center",
//   },
//   summaryValue: {
//     fontSize: 26,
//     fontWeight: "800",
//     color: COLORS.primary,
//   },
//   summaryLabel: {
//     fontSize: 12,
//     color: "#667085",
//     marginTop: 2,
//   },
//   center: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   listContent: {
//     paddingHorizontal: 16,
//     paddingBottom: 100,
//   },
//   emptyText: {
//     textAlign: "center",
//     color: "#667085",
//     fontSize: 15,
//     marginTop: 40,
//   },
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFF",
//     borderRadius: RADIUS.md,
//     borderWidth: 1,
//     borderColor: "#D0D5DD",
//     padding: 12,
//     marginBottom: 8,
//   },
//   rowInfo: {
//     flex: 1,
//     paddingRight: 8,
//   },
//   rowTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: COLORS.text,
//   },
//   rowSubtitle: {
//     fontSize: 12,
//     color: "#667085",
//     marginTop: 2,
//   },
//   counter: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   counterButton: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     borderWidth: 1,
//     borderColor: COLORS.primary,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   quantity: {
//     minWidth: 36,
//     textAlign: "center",
//     fontSize: 18,
//     fontWeight: "800",
//     color: COLORS.text,
//   },
//   deleteButton: {
//     marginLeft: 10,
//     padding: 6,
//   },
//   scanButton: {
//     position: "absolute",
//     left: 16,
//     right: 16,
//     bottom: 30,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: COLORS.primary,
//     paddingVertical: 14,
//     borderRadius: RADIUS.md,
//   },
//   scanButtonText: {
//     color: "#FFF",
//     fontWeight: "700",
//     fontSize: 16,
//     marginLeft: 8,
//   },
// });


import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import {
  decrementCountItem,
  deleteCount,
  finalizeCount,
  removeCountItem,
  reopenCount,
  subscribeToCount,
  subscribeToCountStatus,
} from "../services/countService";
import { getProductById } from "../services/productService";

export default function CountScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("open");
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const namesRef = useRef({});
  const itemsRef = useRef([]);

  // Trae la descripción de cada producto (una lectura por producto, con caché)
  const loadNames = useCallback(async (list, force = false) => {
    const missing = list.filter(
      (item) => force || !(item.id in namesRef.current),
    );
    if (missing.length === 0) return;

    const entries = await Promise.all(
      missing.map(async (item) => {
        try {
          const product = await getProductById(item.id);
          return [item.id, product?.name || ""];
        } catch (err) {
          console.warn("No se pudo leer el producto:", err);
          return [item.id, ""];
        }
      }),
    );

    entries.forEach(([id, name]) => {
      namesRef.current[id] = name;
    });
    setNames({ ...namesRef.current });
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const unsubscribeItems = subscribeToCount(
      user.uid,
      (data) => {
        itemsRef.current = data;
        setItems(data);
        setError(null);
        setLoading(false);
        loadNames(data);
      },
      (err) => {
        console.error("Error al cargar la lista:", err);
        setError("No se pudo cargar la lista.");
        setLoading(false);
      },
    );

    const unsubscribeStatus = subscribeToCountStatus(
      user.uid,
      setStatus,
      (err) => console.warn("Error al leer el estado de la lista:", err),
    );

    return () => {
      unsubscribeItems();
      unsubscribeStatus();
    };
  }, [user?.uid, loadNames]);

  // Al volver de la ficha, refresca las descripciones
  useFocusEffect(
    useCallback(() => {
      loadNames(itemsRef.current, true);
    }, [loadNames]),
  );

  const totals = useMemo(
    () => ({
      products: items.length,
      units: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    }),
    [items],
  );

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const descA = names[a.id] || "";
      const descB = names[b.id] || "";
      if (descA && !descB) return -1;
      if (!descA && descB) return 1;
      return (descA || String(a.productNumber)).localeCompare(
        descB || String(b.productNumber),
        undefined,
        { numeric: true },
      );
    });
  }, [items, names]);

  const finalized = status === "finalized";
  const locked = finalized || busy;

  const runAction = async (action, errorMessage) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      console.error(errorMessage, err);
      Alert.alert("Error", errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const handleDecrement = (item) =>
    runAction(
      () => decrementCountItem(user.uid, item.id),
      "No se pudo restar la cantidad.",
    );

  const handleRemove = (item) => {
    const label = names[item.id] || "este producto";
    Alert.alert(
      "Quitar de la lista",
      `¿Quitar ${label} de tu lista? El producto sigue registrado en la base.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () =>
            runAction(
              () => removeCountItem(user.uid, item.id),
              "No se pudo quitar el producto de la lista.",
            ),
        },
      ],
    );
  };

  const handleFinalize = () => {
    if (items.length === 0) {
      Alert.alert("Lista vacía", "Todavía no leíste ningún código hoy.");
      return;
    }

    Alert.alert(
      "Finalizar lista",
      `Vas a cerrar tu lista con ${totals.units} unidades de ${totals.products} productos. No podrás seguir escaneando hasta reabrirla.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          onPress: () =>
            runAction(async () => {
              await finalizeCount(user.uid, totals);
              Alert.alert("✅ Lista finalizada", "Tu lista quedó guardada.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            }, "No se pudo finalizar la lista."),
        },
      ],
    );
  };

  const handleReopen = () =>
    runAction(() => reopenCount(user.uid), "No se pudo reabrir la lista.");

  const handleDeleteAll = () => {
    Alert.alert(
      "Eliminar lista",
      "Se borrará de la base de datos tu lista de hoy completa. Los productos registrados NO se eliminan. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () =>
            runAction(async () => {
              await deleteCount(user.uid);
              namesRef.current = {};
              setNames({});
            }, "No se pudo eliminar la lista."),
        },
      ],
    );
  };

  const renderItem = ({ item }) => {
    const loaded = item.id in names;
    const description = names[item.id];
    const label = !loaded ? "Cargando..." : description || "SIN DESCRIPCIÓN";
    const muted = !loaded || !description;

    return (
      <View style={styles.row}>
        <Pressable
          style={styles.rowInfo}
          onPress={() =>
            router.push({ pathname: "/product-form", params: { id: item.id } })
          }
        >
          <Text
            style={[styles.rowTitle, muted && styles.rowTitleMuted]}
            numberOfLines={2}
          >
            {label}
          </Text>
          {loaded && !description && (
            <Text style={styles.rowHint}>Tocá para completar</Text>
          )}
        </Pressable>

        <Text style={styles.quantity}>{item.quantity}</Text>

        <Pressable
          style={[styles.iconButton, locked && styles.iconButtonDisabled]}
          onPress={() => handleDecrement(item)}
          disabled={locked}
        >
          <Ionicons name="remove" size={20} color={COLORS.primary} />
        </Pressable>

        <Pressable
          style={[styles.deleteButton, locked && styles.iconButtonDisabled]}
          onPress={() => handleRemove(item)}
          disabled={locked}
        >
          <Ionicons name="trash-outline" size={20} color="#B42318" />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Mi lista de hoy</Text>
        {finalized && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>FINALIZADA</Text>
          </View>
        )}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryValue}>{totals.units}</Text>
          <Text style={styles.summaryLabel}>Total en la lista</Text>
        </View>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryValue}>{totals.products}</Text>
          <Text style={styles.summaryLabel}>Productos distintos</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Todavía no leíste ningún código hoy.
            </Text>
          }
        />
      )}

      <View style={styles.footer}>
        {finalized ? (
          <Pressable
            style={[styles.outlineButton, busy && styles.buttonDisabled]}
            onPress={handleReopen}
            disabled={busy}
          >
            <Ionicons name="lock-open-outline" size={20} color={COLORS.primary} />
            <Text style={styles.outlineButtonText}>Reabrir lista</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryButton, busy && styles.buttonDisabled]}
            onPress={handleFinalize}
            disabled={busy}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={styles.primaryButtonText}>Finalizado</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.dangerButton, busy && styles.buttonDisabled]}
          onPress={handleDeleteAll}
          disabled={busy}
        >
          <Ionicons name="trash-outline" size={20} color="#B42318" />
          <Text style={styles.dangerButtonText}>Eliminar lista</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  chip: {
    backgroundColor: "#DCFAE6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    color: "#067647",
    fontSize: 11,
    fontWeight: "800",
  },
  summary: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    paddingVertical: 12,
  },
  summaryBlock: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#667085",
    fontSize: 15,
    marginTop: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    padding: 12,
    marginBottom: 8,
  },
  rowInfo: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  rowTitleMuted: {
    color: "#98A2B3",
    fontStyle: "italic",
    fontWeight: "600",
  },
  rowHint: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  quantity: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#FDA29B",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDA29B",
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    marginTop: 10,
  },
  dangerButtonText: {
    color: "#B42318",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});