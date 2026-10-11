import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, RADIUS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { EMPTY, LOCAL_KEYS, subscribeLocal } from "../services/localStore";
import { syncNow, useSyncStatus } from "../services/syncService";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(ms) {
  const d = new Date(ms);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  if (d.toDateString() === new Date().toDateString()) return time;

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${time}`;
}

const TONES = {
  ok: { bg: "#ECFDF3", fg: "#067647" },
  warn: { bg: "#FFFAEB", fg: "#B54708" },
  error: { bg: "#FEF3F2", fg: "#B42318" },
  info: { bg: "#EAF3FF", fg: COLORS.primary },
};

export default function SyncStatusCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const status = useSyncStatus();
  const [catalog, setCatalog] = useState({ count: 0, lastSyncMs: null });

  useEffect(
    () =>
      subscribeLocal(LOCAL_KEYS.catalog, EMPTY.catalog, (value) => {
        setCatalog({
          count: Object.keys(value.products).length,
          lastSyncMs: value.lastSyncMs,
        });
      }),
    [],
  );

  const pendingTotal =
    status.pending +
    (status.historyPending ? 1 : 0) +
    (status.listPending ? 1 : 0);
  const neverSynced = !catalog.lastSyncMs && catalog.count === 0;

  let tone = "ok";
  let icon = "cloud-done-outline";
  let label = t("sync.synced", { defaultValue: "Sincronizado" });

  if (status.syncing) {
    tone = "info";
    icon = "sync-outline";
    label = t("sync.syncing", { defaultValue: "Sincronizando..." });
  } else if (neverSynced) {
    tone = "error";
    icon = "alert-circle-outline";
    label = status.online
      ? t("sync.noCatalog", { defaultValue: "Sin catálogo" })
      : t("sync.offline", { defaultValue: "Sin conexión" });
  } else if (!status.online) {
    tone = "warn";
    icon = "cloud-offline-outline";
    label = t("sync.offline", { defaultValue: "Sin conexión" });
  } else if (status.lastError) {
    tone = "warn";
    icon = "alert-circle-outline";
    label = t("sync.error", { defaultValue: "No se pudo sincronizar" });
  } else if (pendingTotal > 0) {
    tone = "warn";
    icon = "cloud-upload-outline";
    label = t("sync.pending", {
      count: pendingTotal,
      defaultValue: "{{count}} sin subir",
    });
  }

  const detail = neverSynced
    ? t("sync.neverSynced", {
        defaultValue:
          "Todavía no descargaste el catálogo. Conectate a internet antes de entrar al galpón.",
      })
    : [
        t("sync.products", {
          count: catalog.count,
          defaultValue: "{{count}} productos descargados",
        }),
        catalog.lastSyncMs
          ? t("sync.lastSync", {
              time: formatTime(catalog.lastSyncMs),
              defaultValue: "Última sincronización: {{time}}",
            })
          : null,
      ]
        .filter(Boolean)
        .join(" · ");

  const colors = TONES[tone];
  const disabled = !status.online || status.syncing || !user?.uid;

  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      <Ionicons name={icon} size={22} color={colors.fg} />

      <View style={styles.texts}>
        <Text style={[styles.label, { color: colors.fg }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.detail} numberOfLines={2}>
          {detail}
        </Text>
      </View>

      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={() => syncNow(user?.uid)}
        disabled={disabled}
        hitSlop={8}
      >
        {status.syncing ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Text style={styles.buttonText}>
            {t("sync.button", { defaultValue: "Sincronizar" })}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  texts: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
  },
  detail: {
    fontSize: 10,
    color: "#475467",
    marginTop: 1,
  },
  button: {
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});