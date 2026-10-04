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
  finalizeCount,
  removeCountItem,
  reopenCount,
  subscribeToCount,
  subscribeToCountMeta,
} from "../../services/countService";
import { getProductById, isAdminUser } from "../../services/productService";
import { saveListRecord } from "../../services/historyService";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDateTime(ms) {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ status: "open", recordId: null });
  const [names, setNames] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
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
    let active = true;

    isAdminUser(user?.uid).then((value) => {
      if (active) setIsAdmin(value);
    });

    return () => {
      active = false;
    };
  }, [user?.uid]);

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

    const unsubscribeMeta = subscribeToCountMeta(user.uid, setMeta, (err) =>
      console.warn("Error al leer el estado de la lista:", err),
    );

    return () => {
      unsubscribeItems();
      unsubscribeMeta();
    };
  }, [user?.uid, loadNames]);

  // Al volver de la ficha o de otra pestaña, refresca las descripciones
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

  const sortedItems = useMemo(() => sortItems(items, names), [items, names]);

  const startedAt = useMemo(() => {
    const times = items
      .map((item) => item.createdAtMs)
      .filter((value) => typeof value === "number");
    return times.length ? Math.min(...times) : null;
  }, [items]);

  const finalized = meta.status === "finalized";
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

  // Guarda una copia de la lista en el historial
  const archiveList = async (recordId) => {
    await loadNames(itemsRef.current);

    const list = sortItems(itemsRef.current, namesRef.current);
    const times = list
      .map((item) => item.createdAtMs)
      .filter((value) => typeof value === "number");

    await saveListRecord(user.uid, {
      recordId,
      startedAt: times.length ? Math.min(...times) : null,
      closedAt: Date.now(),
      items: list.map((item) => ({
        productNumber: item.productNumber,
        description: namesRef.current[item.id] || "",
        quantity: item.quantity,
      })),
    });
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
      Alert.alert("Lista vacía", "Todavía no leíste ningún código.");
      return;
    }

    Alert.alert(
      "Finalizar lista",
      `Vas a cerrar tu lista con ${totals.units} unidades de ${totals.products} productos. Se guarda en el historial y no podrás seguir escaneando hasta reabrirla.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          onPress: () =>
            runAction(async () => {
              const recordId = meta.recordId || String(Date.now());
              await archiveList(recordId);
              await finalizeCount(user.uid, { recordId, totals });
              Alert.alert(
                "✅ Lista finalizada",
                "Quedó guardada en tu historial. Cuando quieras empezar una nueva, eliminá esta lista.",
              );
            }, "No se pudo finalizar la lista."),
        },
      ],
    );
  };

  const handleReopen = () =>
    runAction(() => reopenCount(user.uid), "No se pudo reabrir la lista.");

  const handleDeleteAll = () => {
    const message = finalized
      ? "Se borrará la lista de la base de datos. Ya está guardada en tu historial. Los productos registrados NO se eliminan."
      : items.length > 0
        ? "Se guardará una copia en tu historial y se borrará la lista de la base de datos. Los productos registrados NO se eliminan."
        : "Se borrará la lista. Los productos registrados NO se eliminan.";

    Alert.alert("Eliminar lista", message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          runAction(async () => {
            // Si falla el guardado en el historial, no se borra nada
            if (!finalized && itemsRef.current.length > 0) {
              await archiveList(meta.recordId || String(Date.now()));
            }
            await deleteCount(user.uid);
            namesRef.current = {};
            setNames({});
          }, "No se pudo eliminar la lista. Si falló el guardado en el historial, la lista no se borró."),
      },
    ]);
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
          disabled={!isAdmin}
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
          {isAdmin && loaded && !description && (
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

  const footer = (
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
  );

  const header = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Mi lista</Text>
          {startedAt && (
            <Text style={styles.startedAt}>
              Iniciada el {formatDateTime(startedAt)}
            </Text>
          )}
        </View>
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
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{error}</Text>
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
          Todavía no leíste ningún código. Escaneá desde el inicio.
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