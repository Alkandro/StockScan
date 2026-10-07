import React, { useCallback, useState } from "react";
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
import { restoreCount } from "../../services/countService";
import {
  clearHistory,
  getHistoryRecords,
  removeListRecord,
} from "../../services/historyService";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDay(ms) {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatDateTime(ms) {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [openRecordId, setOpenRecordId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Acción en curso sobre una lista: { id, action: "reopen" | "delete" }
  const [working, setWorking] = useState(null);

  // Se lee una sola vez cada vez que se abre la pestaña (sin listeners)
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return undefined;
      let active = true;

      (async () => {
        try {
          const data = await getHistoryRecords(user.uid);
          if (active) {
            setRecords(data);
            setError(null);
          }
        } catch (err) {
          console.error("Error al cargar el historial:", err);
          if (active) setError("No se pudo cargar el historial.");
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [user?.uid]),
  );

  const handleClear = () => {
    Alert.alert(
      "Borrar historial",
      "Se eliminarán todas las listas guardadas en tu historial. Tu lista actual y los productos registrados no se tocan. ¿Querés continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await clearHistory(user.uid);
              setRecords([]);
              setOpenRecordId(null);
            } catch (err) {
              console.error("Error al borrar el historial:", err);
              Alert.alert("Error", "No se pudo borrar el historial.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const runReopen = async (record) => {
    setWorking({ id: record.id, action: "reopen" });
    try {
      await restoreCount(user.uid, {
        startedAt: record.startedAt,
        items: (record.items || []).map((entry) => ({
          productNumber: entry.c,
          quantity: entry.q,
        })),
      });

      // La lista vuelve a ser la actual: se quita del historial
      await removeListRecord(user.uid, record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      setOpenRecordId(null);

      Alert.alert(
        "✅ Lista reabierta",
        "Ya está en la pestaña Lista. Cuando la finalices de nuevo, vuelve al historial.",
        [
          { text: "Ver lista", onPress: () => router.navigate("/list") },
          { text: "OK", style: "cancel" },
        ],
      );
    } catch (err) {
      if (err?.code === "list-not-empty") {
        Alert.alert(
          "Ya tenés una lista en curso",
          "Finalizala o eliminala desde la pestaña Lista antes de reabrir otra.",
        );
      } else {
        console.error("Error al reabrir la lista:", err);
        Alert.alert("Error", "No se pudo reabrir la lista.");
      }
    } finally {
      setWorking(null);
    }
  };

  const handleReopen = (record) => {
    Alert.alert(
      "Reabrir lista",
      "Esta lista pasará a ser tu lista actual, con sus cantidades, y se quitará del historial hasta que la vuelvas a finalizar.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Reabrir", onPress: () => runReopen(record) },
      ],
    );
  };

  const runDeleteRecord = async (record) => {
    setWorking({ id: record.id, action: "delete" });
    try {
      await removeListRecord(user.uid, record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      setOpenRecordId(null);
    } catch (err) {
      console.error("Error al eliminar la lista del historial:", err);
      Alert.alert("Error", "No se pudo eliminar la lista del historial.");
    } finally {
      setWorking(null);
    }
  };

  const handleDeleteRecord = (record) => {
    Alert.alert(
      "Eliminar lista del historial",
      `Se eliminará la lista del ${formatDay(record.closedAt)} (${record.totalUnits} unidades de ${record.totalProducts} productos). Las demás listas, tu lista actual y los productos registrados no se tocan. Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => runDeleteRecord(record),
        },
      ],
    );
  };

  const renderRecord = ({ item }) => {
    const isOpen = openRecordId === item.id;
    const reopening = working?.id === item.id && working.action === "reopen";
    const removing = working?.id === item.id && working.action === "delete";
    const anyWorking = working !== null;

    return (
      <View style={styles.record}>
        <Pressable
          style={styles.recordHeader}
          onPress={() => setOpenRecordId(isOpen ? null : item.id)}
        >
          <View style={styles.recordInfo}>
            <Text style={styles.recordTitle}>{formatDay(item.closedAt)}</Text>
            <Text style={styles.recordSubtitle}>
              {item.totalUnits} unidades · {item.totalProducts} productos
            </Text>
          </View>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.text}
          />
        </Pressable>

        {isOpen && (
          <View style={styles.recordBody}>
            {item.startedAt && (
              <Text style={styles.recordMeta}>
                Iniciada el {formatDateTime(item.startedAt)} · Cerrada el{" "}
                {formatDateTime(item.closedAt)}
              </Text>
            )}

            {(item.items || []).map((entry, index) => (
              <View key={`${entry.c}-${index}`} style={styles.entryRow}>
                <View style={styles.entryInfo}>
                  <Text
                    style={[
                      styles.entryTitle,
                      !entry.d && styles.entryTitleMuted,
                    ]}
                    numberOfLines={2}
                  >
                    {entry.d || "SIN DESCRIPCIÓN"}
                  </Text>
                  {!entry.d && entry.c ? (
                    <Text style={styles.entryCode}>{entry.c}</Text>
                  ) : null}
                </View>
                <Text style={styles.entryQuantity}>{entry.q}</Text>
              </View>
            ))}

            <View style={styles.actions}>
              <Pressable
                style={[
                  styles.reopenButton,
                  anyWorking && styles.buttonDisabled,
                ]}
                onPress={() => handleReopen(item)}
                disabled={anyWorking}
              >
                {reopening ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="lock-open-outline"
                      size={18}
                      color={COLORS.primary}
                    />
                    <Text style={styles.reopenButtonText}>Reabrir lista</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.deleteRecordButton,
                  anyWorking && styles.buttonDisabled,
                ]}
                onPress={() => handleDeleteRecord(item)}
                disabled={anyWorking}
              >
                {removing ? (
                  <ActivityIndicator color="#B42318" />
                ) : (
                  <>
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#B42318"
                    />
                    <Text style={styles.deleteRecordButtonText}>Eliminar</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  const header = (
    <View style={styles.card}>
      <Pressable
        style={styles.cardHeader}
        onPress={() => setExpanded((value) => !value)}
      >
        <Ionicons name="time-outline" size={24} color={COLORS.primary} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Historial de listas</Text>
          <Text style={styles.cardSubtitle}>
            {records.length} {records.length === 1 ? "lista" : "listas"} guardadas
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={22}
          color={COLORS.text}
        />
      </Pressable>

      {expanded && records.length > 0 && (
        <Pressable
          style={[
            styles.clearButton,
            (deleting || working !== null) && styles.buttonDisabled,
          ]}
          onPress={handleClear}
          disabled={deleting || working !== null}
        >
          <Ionicons name="trash-outline" size={18} color="#B42318" />
          <Text style={styles.clearButtonText}>Borrar todo el historial</Text>
        </Pressable>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial</Text>

      {error ? (
        <Text style={styles.emptyText}>{error}</Text>
      ) : (
        <FlatList
          data={expanded ? records : []}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
          ListHeaderComponent={header}
          ListEmptyComponent={
            expanded ? (
              <Text style={styles.emptyText}>
                Todavía no hay listas guardadas. Se guardan al tocar
                “Finalizado” o “Eliminar lista”.
              </Text>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    marginBottom: 10,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    paddingVertical: 12,
  },
  clearButtonText: {
    color: "#B42318",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyText: {
    textAlign: "center",
    color: "#667085",
    fontSize: 15,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  record: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    marginBottom: 8,
    overflow: "hidden",
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  recordSubtitle: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  recordBody: {
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recordMeta: {
    fontSize: 12,
    color: "#667085",
    marginBottom: 6,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  entryInfo: {
    flex: 1,
    paddingRight: 8,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  entryTitleMuted: {
    color: "#98A2B3",
    fontStyle: "italic",
    fontWeight: "600",
  },
  entryCode: {
    fontSize: 12,
    color: "#667085",
    marginTop: 1,
  },
  entryQuantity: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 6,
  },
  reopenButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  reopenButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },
  deleteRecordButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDA29B",
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  deleteRecordButtonText: {
    color: "#B42318",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },
});