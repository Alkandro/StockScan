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
import { useTranslation } from "react-i18next";

import { COLORS, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import {
  entriesFromPallets,
  formatPalletBreakdown,
  restoreCount,
} from "../../services/countService";

import {
  clearHistory,
  getHistoryRecords,
  removeListRecord,
  setRecordItemChecked,
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

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function HistoryScreen() {
  const { t } = useTranslation();

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
          console.error(t("history.errors.loadConsole"), err);

          if (active) {
            setError(t("history.errors.load"));
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      })();

      return () => {
        active = false;
      };
    }, [user?.uid, t])
  );

  const handleClear = () => {
    Alert.alert(
      t("history.alerts.clearTitle"),
      t("history.alerts.clearMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",

          onPress: async () => {
            setDeleting(true);

            try {
              await clearHistory(user.uid);

              setRecords([]);
              setOpenRecordId(null);
            } catch (err) {
              console.error(t("history.errors.clearConsole"), err);

              Alert.alert(
                t("common.error"),
                t("history.errors.clear")
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Tilda o destilda una pieza ("ya la cargué")
  const handleToggleChecked = async (record, entry) => {
    try {
      await setRecordItemChecked(
        user.uid,
        record.id,
        entry.c,
        !entry.x
      );

      setRecords(await getHistoryRecords(user.uid));
    } catch (err) {
      console.error(t("pallets.checkConsole"), err);

      Alert.alert(
        t("common.error"),
        t("pallets.checkError")
      );
    }
  };

  const runReopen = async (record) => {
    setWorking({
      id: record.id,
      action: "reopen",
    });

    try {
      await restoreCount(user.uid, {
        startedAt: record.startedAt,
        palletCount: record.palletCount,

        items: (record.items || []).map((entry) => ({
          productNumber: entry.c,
          quantity: entry.q,
          pallets: entry.p,
        })),
      });

      // La lista vuelve a ser la actual: se quita del historial
      await removeListRecord(user.uid, record.id);

      setRecords((prev) =>
        prev.filter((r) => r.id !== record.id)
      );

      setOpenRecordId(null);

      Alert.alert(
        t("history.alerts.reopenedTitle"),
        t("history.alerts.reopenedMessage"),
        [
          {
            text: t("history.buttons.viewList"),
            onPress: () => router.navigate("/list"),
          },
          {
            text: t("common.ok"),
            style: "cancel",
          },
        ]
      );
    } catch (err) {
      if (err?.code === "list-not-empty") {
        Alert.alert(
          t("history.alerts.listAlreadyOpenTitle"),
          t("history.alerts.listAlreadyOpenMessage")
        );
      } else {
        console.error(
          t("history.errors.reopenConsole"),
          err
        );

        Alert.alert(
          t("common.error"),
          t("history.errors.reopen")
        );
      }
    } finally {
      setWorking(null);
    }
  };

  const handleReopen = (record) => {
    Alert.alert(
      t("history.alerts.reopenTitle"),
      t("history.alerts.reopenMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("history.buttons.reopen"),
          onPress: () => runReopen(record),
        },
      ]
    );
  };

  const runDeleteRecord = async (record) => {
    setWorking({
      id: record.id,
      action: "delete",
    });

    try {
      await removeListRecord(user.uid, record.id);

      setRecords((prev) =>
        prev.filter((r) => r.id !== record.id)
      );

      setOpenRecordId(null);
    } catch (err) {
      console.error(
        t("history.errors.deleteConsole"),
        err
      );

      Alert.alert(
        t("common.error"),
        t("history.errors.delete")
      );
    } finally {
      setWorking(null);
    }
  };

  const handleDeleteRecord = (record) => {
    Alert.alert(
      t("history.alerts.deleteRecordTitle"),
      t("history.alerts.deleteRecordMessage", {
        date: formatDay(record.closedAt),
        units: record.totalUnits,
        products: record.totalProducts,
      }),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => runDeleteRecord(record),
        },
      ]
    );
  };

  const renderRecord = ({ item }) => {
    const isOpen = openRecordId === item.id;

    const reopening =
      working?.id === item.id &&
      working.action === "reopen";

    const removing =
      working?.id === item.id &&
      working.action === "delete";

    const anyWorking = working !== null;

    const recordItems = item.items || [];
    const checkedCount = recordItems.filter(
      (entry) => entry.x
    ).length;

    return (
      <View style={styles.record}>
        <Pressable
          style={styles.recordHeader}
          onPress={() =>
            setOpenRecordId(
              isOpen ? null : item.id
            )
          }
        >
          <View style={styles.recordInfo}>
            <Text style={styles.recordTitle}>
              {formatDay(item.closedAt)}
            </Text>

            <Text style={styles.recordSubtitle}>
              {t("history.recordSummary", {
                units: item.totalUnits,
                products: item.totalProducts,
              })}
              {item.palletCount
                ? ` · ${t("pallets.recordPallets", {
                    count: item.palletCount,
                  })}`
                : ""}
            </Text>
          </View>

          <Ionicons
            name={
              isOpen
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color={COLORS.text}
          />
        </Pressable>

        {isOpen && (
          <View style={styles.recordBody}>
            {item.startedAt && (
              <Text style={styles.recordMeta}>
                {t("history.recordDates", {
                  started: formatDateTime(item.startedAt),
                  closed: formatDateTime(item.closedAt),
                })}
              </Text>
            )}

            <Text style={styles.progress}>
              {t("pallets.checkedProgress", {
                done: checkedCount,
                total: recordItems.length,
              })}
            </Text>

            {recordItems.map((entry, index) => {
              const checked = Boolean(entry.x);
              const palletList = entriesFromPallets(entry.p);
              const inSeveralPallets =
                palletList.length > 1;

              return (
                <Pressable
                  key={`${entry.c}-${index}`}
                  style={[
                    styles.entryRow,
                    checked && styles.entryRowChecked,
                  ]}
                  onPress={() =>
                    handleToggleChecked(item, entry)
                  }
                >
                  <Ionicons
                    name={
                      checked
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={26}
                    color={
                      checked
                        ? "#16A34A"
                        : "#98A2B3"
                    }
                    style={styles.checkbox}
                  />

                  <View style={styles.entryInfo}>
                    <Text
                      style={[
                        styles.entryTitle,
                        !entry.d &&
                          styles.entryTitleMuted,
                      ]}
                      numberOfLines={2}
                    >
                      {entry.d ||
                        t("history.noDescription")}
                    </Text>

                    {!entry.d && entry.c ? (
                      <Text
                        style={styles.entryCode}
                      >
                        {entry.c}
                      </Text>
                    ) : null}

                    {inSeveralPallets && (
                      <Text
                        style={styles.entryWarning}
                      >
                        {t("pallets.multiHint", {
                          detail:
                            formatPalletBreakdown(
                              palletList,
                              t
                            ),
                        })}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.entryQuantity}>
                    {entry.q}
                  </Text>
                </Pressable>
              );
            })}

            <View style={styles.actions}>
              <Pressable
                style={[
                  styles.reopenButton,
                  anyWorking &&
                    styles.buttonDisabled,
                ]}
                onPress={() =>
                  handleReopen(item)
                }
                disabled={anyWorking}
              >
                {reopening ? (
                  <ActivityIndicator
                    color={COLORS.primary}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="lock-open-outline"
                      size={18}
                      color={COLORS.primary}
                    />

                    <Text
                      style={
                        styles.reopenButtonText
                      }
                    >
                      {t(
                        "history.buttons.reopen"
                      )}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.deleteRecordButton,
                  anyWorking &&
                    styles.buttonDisabled,
                ]}
                onPress={() =>
                  handleDeleteRecord(item)
                }
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

                    <Text
                      style={
                        styles.deleteRecordButtonText
                      }
                    >
                      {t(
                        "common.delete"
                      )}
                    </Text>
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
        onPress={() =>
          setExpanded((value) => !value)
        }
      >
        <Ionicons
          name="time-outline"
          size={24}
          color={COLORS.primary}
        />

        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>
            {t("history.title")}
          </Text>

          <Text style={styles.cardSubtitle}>
            {t("history.savedLists", {
              count: records.length,
            })}
          </Text>
        </View>

        <Ionicons
          name={
            expanded
              ? "chevron-up"
              : "chevron-down"
          }
          size={22}
          color={COLORS.text}
        />
      </Pressable>

      {expanded && records.length > 0 && (
        <Pressable
          style={[
            styles.clearButton,
            (deleting || working !== null) &&
              styles.buttonDisabled,
          ]}
          onPress={handleClear}
          disabled={
            deleting || working !== null
          }
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color="#B42318"
          />

          <Text style={styles.clearButtonText}>
            {t("history.buttons.clearAll")}
          </Text>
        </Pressable>
      )}
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t("history.screenTitle")}
      </Text>

      {error ? (
        <Text style={styles.emptyText}>
          {error}
        </Text>
      ) : (
        <FlatList
          data={expanded ? records : []}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
          ListHeaderComponent={header}
          ListEmptyComponent={
            expanded ? (
              <Text style={styles.emptyText}>
                {t("history.empty")}
              </Text>
            ) : null
          }
          contentContainerStyle={
            styles.listContent
          }
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

  progress: {
    fontSize: 13,
    fontWeight: "800",
    color: "#067647",
    marginBottom: 4,
  },

  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
    borderRadius: 8,
  },

  entryRowChecked: {
    backgroundColor: "#F0FDF4",
  },

  checkbox: {
    marginRight: 10,
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

  entryWarning: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B54708",
    marginTop: 2,
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