// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import { router, useFocusEffect } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { COLORS, RADIUS } from "../../constants/theme";
// import { useAuth } from "../../context/AuthContext";
// import {
//   decrementCountItem,
//   deleteCount,
//   removeCountItem,
//   subscribeToCount,
// } from "../../services/countService";
// import { getProductById, isAdminUser } from "../../services/productService";
// import { saveListRecord } from "../../services/historyService";

// function pad(n) {
//   return String(n).padStart(2, "0");
// }

// function formatDateTime(ms) {
//   const d = new Date(ms);
//   return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
// }

// // Primero los que tienen descripción (alfabético), después los demás
// function sortItems(list, names) {
//   return [...list].sort((a, b) => {
//     const descA = names[a.id] || "";
//     const descB = names[b.id] || "";
//     if (descA && !descB) return -1;
//     if (!descA && descB) return 1;
//     return (descA || String(a.productNumber)).localeCompare(
//       descB || String(b.productNumber),
//       undefined,
//       { numeric: true },
//     );
//   });
// }

// export default function ListScreen() {
//   const { user } = useAuth();
//   const [items, setItems] = useState([]);
//   const [names, setNames] = useState({});
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [busy, setBusy] = useState(false);

//   const namesRef = useRef({});
//   const itemsRef = useRef([]);
//   // Si falla el borrado después de guardar en el historial, al reintentar
//   // se reemplaza la misma copia en vez de duplicarla
//   const recordIdRef = useRef(null);

//   // Trae la descripción de cada producto (una lectura por producto, con caché)
//   const loadNames = useCallback(async (list, force = false) => {
//     const missing = list.filter(
//       (item) => force || !(item.id in namesRef.current),
//     );
//     if (missing.length === 0) return;

//     const entries = await Promise.all(
//       missing.map(async (item) => {
//         try {
//           const product = await getProductById(item.id);
//           return [item.id, product?.name || ""];
//         } catch (err) {
//           console.warn("No se pudo leer el producto:", err);
//           return [item.id, ""];
//         }
//       }),
//     );

//     entries.forEach(([id, name]) => {
//       namesRef.current[id] = name;
//     });
//     setNames({ ...namesRef.current });
//   }, []);

//   useEffect(() => {
//     let active = true;

//     isAdminUser().then((value) => {
//       if (active) setIsAdmin(value);
//     });

//     return () => {
//       active = false;
//     };
//   }, [user?.uid]);

//   useEffect(() => {
//     if (!user?.uid) return undefined;

//     const unsubscribe = subscribeToCount(
//       user.uid,
//       (data) => {
//         itemsRef.current = data;
//         setItems(data);
//         setError(null);
//         setLoading(false);
//         loadNames(data);
//       },
//       (err) => {
//         console.error("Error al cargar la lista:", err);
//         setError("No se pudo cargar la lista.");
//         setLoading(false);
//       },
//     );

//     return unsubscribe;
//   }, [user?.uid, loadNames]);

//   // Al volver de la ficha o de otra pestaña, refresca las descripciones
//   useFocusEffect(
//     useCallback(() => {
//       loadNames(itemsRef.current, true);
//     }, [loadNames]),
//   );

//   const totals = useMemo(
//     () => ({
//       products: items.length,
//       units: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
//     }),
//     [items],
//   );

//   const sortedItems = useMemo(() => sortItems(items, names), [items, names]);

//   const startedAt = useMemo(() => {
//     const times = items
//       .map((item) => item.createdAtMs)
//       .filter((value) => typeof value === "number");
//     return times.length ? Math.min(...times) : null;
//   }, [items]);

//   const runAction = async (action, errorMessage) => {
//     setBusy(true);
//     try {
//       await action();
//     } catch (err) {
//       console.error(errorMessage, err);
//       Alert.alert("Error", errorMessage);
//     } finally {
//       setBusy(false);
//     }
//   };

//   // Guarda una copia de la lista en el historial
//   const archiveList = async () => {
//     await loadNames(itemsRef.current);

//     const recordId = recordIdRef.current || String(Date.now());
//     recordIdRef.current = recordId;

//     const list = sortItems(itemsRef.current, namesRef.current);
//     const times = list
//       .map((item) => item.createdAtMs)
//       .filter((value) => typeof value === "number");

//     await saveListRecord(user.uid, {
//       recordId,
//       startedAt: times.length ? Math.min(...times) : null,
//       closedAt: Date.now(),
//       items: list.map((item) => ({
//         productNumber: item.productNumber,
//         description: namesRef.current[item.id] || "",
//         quantity: item.quantity,
//       })),
//     });
//   };

//   // Guarda en el historial y vacía la lista actual
//   const archiveAndClear = async () => {
//     if (itemsRef.current.length > 0) {
//       await archiveList();
//     }
//     await deleteCount(user.uid);
//     recordIdRef.current = null;
//     namesRef.current = {};
//     setNames({});
//   };

//   const handleDecrement = (item) =>
//     runAction(
//       () => decrementCountItem(user.uid, item.id),
//       "No se pudo restar la cantidad.",
//     );

//   const handleRemove = (item) => {
//     const label = names[item.id] || "este producto";
//     Alert.alert(
//       "Quitar de la lista",
//       `¿Quitar ${label} de tu lista? El producto sigue registrado en la base.`,
//       [
//         { text: "Cancelar", style: "cancel" },
//         {
//           text: "Quitar",
//           style: "destructive",
//           onPress: () =>
//             runAction(
//               () => removeCountItem(user.uid, item.id),
//               "No se pudo quitar el producto de la lista.",
//             ),
//         },
//       ],
//     );
//   };

//   const handleFinalize = () => {
//     if (items.length === 0) {
//       Alert.alert("Lista vacía", "Todavía no leíste ningún código.");
//       return;
//     }

//     Alert.alert(
//       "Finalizar lista",
//       `Se guardará tu lista (${totals.units} unidades de ${totals.products} productos) en el historial y quedará vacía para empezar una nueva. Desde el historial podés reabrirla.`,
//       [
//         { text: "Cancelar", style: "cancel" },
//         {
//           text: "Finalizar",
//           onPress: () =>
//             runAction(async () => {
//               await archiveAndClear();
//               Alert.alert(
//                 "✅ Lista finalizada",
//                 "Quedó guardada en tu historial. Ya podés empezar una nueva.",
//               );
//             }, "No se pudo finalizar la lista. Si falló el guardado en el historial, la lista no se borró."),
//         },
//       ],
//     );
//   };

//   const handleDeleteAll = () => {
//     const message =
//       items.length > 0
//         ? "Se guardará una copia en tu historial y se borrará la lista de la base de datos. Los productos registrados NO se eliminan."
//         : "Se borrará la lista. Los productos registrados NO se eliminan.";

//     Alert.alert("Eliminar lista", message, [
//       { text: "Cancelar", style: "cancel" },
//       {
//         text: "Eliminar",
//         style: "destructive",
//         onPress: () =>
//           runAction(
//             archiveAndClear,
//             "No se pudo eliminar la lista. Si falló el guardado en el historial, la lista no se borró.",
//           ),
//       },
//     ]);
//   };

//   const renderItem = ({ item }) => {
//     const loaded = item.id in names;
//     const description = names[item.id];
//     const label = !loaded ? "Cargando..." : description || "SIN DESCRIPCIÓN";
//     const muted = !loaded || !description;

//     return (
//       <View style={styles.row}>
//         <Pressable
//           style={styles.rowInfo}
//           disabled={!isAdmin}
//           onPress={() =>
//             router.push({ pathname: "/product-form", params: { id: item.id } })
//           }
//         >
//           <Text
//             style={[styles.rowTitle, muted && styles.rowTitleMuted]}
//             numberOfLines={2}
//           >
//             {label}
//           </Text>
//           {isAdmin && loaded && !description && (
//             <Text style={styles.rowHint}>Tocá para completar</Text>
//           )}
//         </Pressable>

//         <Text style={styles.quantity}>{item.quantity}</Text>

//         <Pressable
//           style={[styles.iconButton, busy && styles.iconButtonDisabled]}
//           onPress={() => handleDecrement(item)}
//           disabled={busy}
//         >
//           <Ionicons name="remove" size={20} color={COLORS.primary} />
//         </Pressable>

//         <Pressable
//           style={[styles.deleteButton, busy && styles.iconButtonDisabled]}
//           onPress={() => handleRemove(item)}
//           disabled={busy}
//         >
//           <Ionicons name="trash-outline" size={20} color="#B42318" />
//         </Pressable>
//       </View>
//     );
//   };

//   const footer = (
//     <View style={styles.footer}>
//       <Pressable
//         style={[styles.primaryButton, busy && styles.buttonDisabled]}
//         onPress={handleFinalize}
//         disabled={busy}
//       >
//         <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
//         <Text style={styles.primaryButtonText}>Finalizado</Text>
//       </Pressable>

//       <Pressable
//         style={[styles.dangerButton, busy && styles.buttonDisabled]}
//         onPress={handleDeleteAll}
//         disabled={busy}
//       >
//         <Ionicons name="trash-outline" size={20} color="#B42318" />
//         <Text style={styles.dangerButtonText}>Eliminar lista</Text>
//       </Pressable>
//     </View>
//   );

//   const header = (
//     <View>
//       <View style={styles.header}>
//         <View style={styles.headerText}>
//           <Text style={styles.title}>Mi lista</Text>
//           {startedAt && (
//             <Text style={styles.startedAt}>
//               Iniciada el {formatDateTime(startedAt)}
//             </Text>
//           )}
//         </View>
//       </View>

//       <View style={styles.summary}>
//         <View style={styles.summaryBlock}>
//           <Text style={styles.summaryValue}>{totals.units}</Text>
//           <Text style={styles.summaryLabel}>Total en la lista</Text>
//         </View>
//         <View style={styles.summaryBlock}>
//           <Text style={styles.summaryValue}>{totals.products}</Text>
//           <Text style={styles.summaryLabel}>Productos distintos</Text>
//         </View>
//       </View>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Text style={styles.emptyText}>{error}</Text>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       style={styles.container}
//       data={sortedItems}
//       keyExtractor={(item) => item.id}
//       renderItem={renderItem}
//       ListHeaderComponent={header}
//       ListFooterComponent={footer}
//       ListEmptyComponent={
//         <Text style={styles.emptyText}>
//           Todavía no leíste ningún código. Escaneá desde el inicio.
//         </Text>
//       }
//       contentContainerStyle={styles.listContent}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   center: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   listContent: {
//     paddingHorizontal: 16,
//     paddingTop: 58,
//     paddingBottom: 100,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   headerText: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "800",
//     color: COLORS.text,
//   },
//   startedAt: {
//     fontSize: 13,
//     color: "#667085",
//     marginTop: 2,
//   },
//   summary: {
//     flexDirection: "row",
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
//   emptyText: {
//     textAlign: "center",
//     color: "#667085",
//     fontSize: 15,
//     marginTop: 30,
//     marginBottom: 10,
//     paddingHorizontal: 20,
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
//   rowTitleMuted: {
//     color: "#98A2B3",
//     fontStyle: "italic",
//     fontWeight: "600",
//   },
//   rowHint: {
//     fontSize: 12,
//     color: "#667085",
//     marginTop: 2,
//   },
//   quantity: {
//     minWidth: 40,
//     textAlign: "center",
//     fontSize: 20,
//     fontWeight: "800",
//     color: COLORS.text,
//   },
//   iconButton: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     borderWidth: 1,
//     borderColor: COLORS.primary,
//     alignItems: "center",
//     justifyContent: "center",
//     marginLeft: 6,
//   },
//   deleteButton: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     borderWidth: 1,
//     borderColor: "#FDA29B",
//     alignItems: "center",
//     justifyContent: "center",
//     marginLeft: 8,
//   },
//   iconButtonDisabled: {
//     opacity: 0.4,
//   },
//   footer: {
//     paddingTop: 16,
//   },
//   primaryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: COLORS.primary,
//     paddingVertical: 14,
//     borderRadius: RADIUS.md,
//   },
//   primaryButtonText: {
//     color: "#FFF",
//     fontWeight: "700",
//     fontSize: 16,
//     marginLeft: 8,
//   },
//   dangerButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#FDA29B",
//     paddingVertical: 14,
//     borderRadius: RADIUS.md,
//     marginTop: 10,
//   },
//   dangerButtonText: {
//     color: "#B42318",
//     fontWeight: "700",
//     fontSize: 16,
//     marginLeft: 8,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
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
import { COLORS, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import {
  decrementCountItem,
  deleteCount,
  removeCountItem,
  subscribeToCount,
} from "../../services/countService";
import { getProductById, isAdminUser } from "../../services/productService";
import { saveListRecord } from "../../services/historyService";
import { useTranslation } from "react-i18next";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDateTime(ms) {
  const d = new Date(ms);

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

// Primero los que tienen descripción (alfabético), después los demás
function sortItems(list, names) {
  return [...list].sort((a, b) => {
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
}

export default function ListScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [names, setNames] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const namesRef = useRef({});
  const itemsRef = useRef([]);

  // Si falla el borrado después de guardar en el historial,
  // al reintentar se reemplaza la misma copia en vez de duplicarla
  const recordIdRef = useRef(null);

  // Trae la descripción de cada producto
  // (una lectura por producto, con caché)
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
          console.warn(
            t("list.errors.productReadConsole"),
            err,
          );

          return [item.id, ""];
        }
      }),
    );

    entries.forEach(([id, name]) => {
      namesRef.current[id] = name;
    });

    setNames({ ...namesRef.current });
  }, [t]);

  useEffect(() => {
    let active = true;

    isAdminUser().then((value) => {
      if (active) {
        setIsAdmin(value);
      }
    });

    return () => {
      active = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const unsubscribe = subscribeToCount(
      user.uid,
      (data) => {
        itemsRef.current = data;
        setItems(data);
        setError(null);
        setLoading(false);
        loadNames(data);
      },
      (err) => {
        console.error(
          t("list.errors.loadConsole"),
          err,
        );

        setError(t("list.errors.load"));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid, loadNames, t]);

  // Al volver de la ficha o de otra pestaña,
  // refresca las descripciones
  useFocusEffect(
    useCallback(() => {
      loadNames(itemsRef.current, true);
    }, [loadNames]),
  );

  const totals = useMemo(
    () => ({
      products: items.length,
      units: items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      ),
    }),
    [items],
  );

  const sortedItems = useMemo(
    () => sortItems(items, names),
    [items, names],
  );

  const startedAt = useMemo(() => {
    const times = items
      .map((item) => item.createdAtMs)
      .filter((value) => typeof value === "number");

    return times.length ? Math.min(...times) : null;
  }, [items]);

  const runAction = async (action, errorMessage) => {
    setBusy(true);

    try {
      await action();
    } catch (err) {
      console.error(errorMessage, err);

      Alert.alert(
        t("common.error"),
        errorMessage,
      );
    } finally {
      setBusy(false);
    }
  };

  // Guarda una copia de la lista en el historial
  const archiveList = async () => {
    await loadNames(itemsRef.current);

    const recordId =
      recordIdRef.current || String(Date.now());

    recordIdRef.current = recordId;

    const list = sortItems(
      itemsRef.current,
      namesRef.current,
    );

    const times = list
      .map((item) => item.createdAtMs)
      .filter((value) => typeof value === "number");

    await saveListRecord(user.uid, {
      recordId,
      startedAt: times.length
        ? Math.min(...times)
        : null,
      closedAt: Date.now(),
      items: list.map((item) => ({
        productNumber: item.productNumber,
        description:
          namesRef.current[item.id] || "",
        quantity: item.quantity,
      })),
    });
  };

  // Guarda en el historial y vacía la lista actual
  const archiveAndClear = async () => {
    if (itemsRef.current.length > 0) {
      await archiveList();
    }

    await deleteCount(user.uid);

    recordIdRef.current = null;
    namesRef.current = {};
    setNames({});
  };

  const handleDecrement = (item) =>
    runAction(
      () =>
        decrementCountItem(
          user.uid,
          item.id,
        ),
      t("list.errors.decrement"),
    );

  const handleRemove = (item) => {
    const label =
      names[item.id] ||
      t("list.thisProduct");

    Alert.alert(
      t("list.alerts.removeTitle"),

      t("list.alerts.removeMessage", {
        label,
      }),

      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("list.buttons.remove"),
          style: "destructive",
          onPress: () =>
            runAction(
              () =>
                removeCountItem(
                  user.uid,
                  item.id,
                ),
              t("list.errors.remove"),
            ),
        },
      ],
    );
  };

  const handleFinalize = () => {
    if (items.length === 0) {
      Alert.alert(
        t("list.alerts.emptyTitle"),
        t("list.alerts.emptyMessage"),
      );

      return;
    }

    Alert.alert(
      t("list.alerts.finalizeTitle"),

      t("list.alerts.finalizeMessage", {
        units: totals.units,
        products: totals.products,
      }),

      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("list.buttons.finalize"),
          onPress: () =>
            runAction(
              async () => {
                await archiveAndClear();

                Alert.alert(
                  t("list.alerts.finalizedTitle"),
                  t("list.alerts.finalizedMessage"),
                );
              },
              t("list.errors.finalize"),
            ),
        },
      ],
    );
  };

  const handleDeleteAll = () => {
    const message =
      items.length > 0
        ? t("list.alerts.deleteMessageWithItems")
        : t("list.alerts.deleteMessageEmpty");

    Alert.alert(
      t("list.alerts.deleteTitle"),
      message,
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () =>
            runAction(
              archiveAndClear,
              t("list.errors.delete"),
            ),
        },
      ],
    );
  };

  const renderItem = ({ item }) => {
    const loaded = item.id in names;
    const description = names[item.id];

    const label = !loaded
      ? t("list.loading")
      : description || t("list.noDescription");

    const muted = !loaded || !description;

    return (
      <View style={styles.row}>
        <Pressable
          style={styles.rowInfo}
          disabled={!isAdmin}
          onPress={() =>
            router.push({
              pathname: "/product-form",
              params: { id: item.id },
            })
          }
        >
          <Text
            style={[
              styles.rowTitle,
              muted && styles.rowTitleMuted,
            ]}
            numberOfLines={2}
          >
            {label}
          </Text>

          {isAdmin && loaded && !description && (
            <Text style={styles.rowHint}>
              {t("list.completeHint")}
            </Text>
          )}
        </Pressable>

        <Text style={styles.quantity}>
          {item.quantity}
        </Text>

        <Pressable
          style={[
            styles.iconButton,
            busy && styles.iconButtonDisabled,
          ]}
          onPress={() => handleDecrement(item)}
          disabled={busy}
        >
          <Ionicons
            name="remove"
            size={20}
            color={COLORS.primary}
          />
        </Pressable>

        <Pressable
          style={[
            styles.deleteButton,
            busy && styles.iconButtonDisabled,
          ]}
          onPress={() => handleRemove(item)}
          disabled={busy}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color="#B42318"
          />
        </Pressable>
      </View>
    );
  };

  const footer = (
    <View style={styles.footer}>
      <Pressable
        style={[
          styles.primaryButton,
          busy && styles.buttonDisabled,
        ]}
        onPress={handleFinalize}
        disabled={busy}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={20}
          color="#FFF"
        />

        <Text style={styles.primaryButtonText}>
          {t("list.buttons.finalized")}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.dangerButton,
          busy && styles.buttonDisabled,
        ]}
        onPress={handleDeleteAll}
        disabled={busy}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color="#B42318"
        />

        <Text style={styles.dangerButtonText}>
          {t("list.buttons.deleteList")}
        </Text>
      </Pressable>
    </View>
  );

  const header = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {t("list.title")}
          </Text>

          {startedAt && (
            <Text style={styles.startedAt}>
              {t("list.startedAt", {
                date: formatDateTime(startedAt),
              })}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryValue}>
            {totals.units}
          </Text>

          <Text style={styles.summaryLabel}>
            {t("list.totalInList")}
          </Text>
        </View>

        <View style={styles.summaryBlock}>
          <Text style={styles.summaryValue}>
            {totals.products}
          </Text>

          <Text style={styles.summaryLabel}>
            {t("list.differentProducts")}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={sortedItems}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          {t("list.empty")}
        </Text>
      }
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 58,
    paddingBottom: 100,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },

  startedAt: {
    fontSize: 13,
    color: "#667085",
    marginTop: 2,
  },

  summary: {
    flexDirection: "row",
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

  emptyText: {
    textAlign: "center",
    color: "#667085",
    fontSize: 15,
    marginTop: 30,
    marginBottom: 10,
    paddingHorizontal: 20,
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
    paddingTop: 16,
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