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
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import {
  decrementCountItem,
  deleteCount,
  formatPalletBreakdown,
  palletEntries,
  removeCountItem,
} from "../../services/countService";
import { useListState } from "../../services/useListState";
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
  const params = useLocalSearchParams();

  const { items, session, totals, loaded } = useListState(user?.uid);

  const [names, setNames] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);

  const namesRef = useRef({});
  const itemsRef = useRef([]);
  const sessionRef = useRef(null);

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
    itemsRef.current = items;
    sessionRef.current = session;
    loadNames(items);
  }, [items, session, loadNames]);

  // Al volver de la ficha o de otra pestaña,
  // refresca las descripciones
  useFocusEffect(
    useCallback(() => {
      loadNames(itemsRef.current, true);
    }, [loadNames]),
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

  // Guarda una copia de la lista en el historial, con el detalle por palet
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

    // Cantidad de palets trabajados: el más alto con lecturas o donde quedó
    let highestPallet = 0;

    list.forEach((item) => {
      palletEntries(item).forEach((entry) => {
        highestPallet = Math.max(highestPallet, entry.pallet);
      });
    });

    const palletCount =
      Math.max(
        highestPallet,
        sessionRef.current?.currentPallet || 0,
      ) || null;

    await saveListRecord(user.uid, {
      recordId,
      startedAt: times.length
        ? Math.min(...times)
        : null,
      closedAt: Date.now(),
      palletCount,
      items: list.map((item) => ({
        productNumber: item.productNumber,
        description:
          namesRef.current[item.id] || "",
        quantity: item.quantity,
        pallets: item.pallets,
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

  // Llegó desde "Finalizar lista" de la cámara: abre la confirmación
  const finalizeRequested = params.finalize === "1";

  useEffect(() => {
    if (!finalizeRequested || !loaded) return;

    router.setParams({ finalize: "" });
    handleFinalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalizeRequested, loaded]);

  const renderItem = ({ item }) => {
    const loadedName = item.id in names;
    const description = names[item.id];

    const label = !loadedName
      ? t("list.loading")
      : description || t("list.noDescription");

    const muted = !loadedName || !description;

    // Mismo producto en más de un palet: se avisa con el detalle
    const entries = palletEntries(item);
    const inSeveralPallets = entries.length > 1;

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

          {inSeveralPallets && (
            <Text style={styles.rowWarning}>
              {t("pallets.multiHint", {
                detail: formatPalletBreakdown(entries, t),
              })}
            </Text>
          )}

          {isAdmin && loadedName && !description && (
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

          {session && (
            <Text style={styles.sessionLabel}>
              {t("pallets.ofTotal", {
                current: session.currentPallet,
                total: session.totalPallets,
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

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
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

  sessionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
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

  rowWarning: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B54708",
    marginTop: 3,
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
