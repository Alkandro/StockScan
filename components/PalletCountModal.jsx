import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, RADIUS } from "../constants/theme";
import { MAX_PALLETS } from "../services/countService";

export default function PalletCountModal({
  visible,
  onConfirm,
  onCancel,
  busy = false,
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("1");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setValue("1");
      setError(null);
    }
  }, [visible]);

  const change = (delta) => {
    const current = Number.parseInt(value, 10) || 0;

    setValue(String(Math.min(MAX_PALLETS, Math.max(1, current + delta))));
    setError(null);
  };

  const submit = () => {
    const count = Number.parseInt(value, 10);

    if (!Number.isInteger(count) || count < 1 || count > MAX_PALLETS) {
      setError(t("pallets.modalInvalid", { max: MAX_PALLETS }));
      return;
    }

    onConfirm(count);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{t("pallets.modalTitle")}</Text>
          <Text style={styles.message}>{t("pallets.modalMessage")}</Text>

          <Text style={styles.label}>{t("pallets.modalLabel")}</Text>

          <View style={styles.counter}>
            <Pressable
              style={styles.stepButton}
              onPress={() => change(-1)}
              disabled={busy}
              hitSlop={8}
            >
              <Ionicons name="remove" size={26} color={COLORS.primary} />
            </Pressable>

            <TextInput
              style={styles.input}
              value={value}
              onChangeText={(text) => {
                setValue(text.replace(/[^0-9]/g, ""));
                setError(null);
              }}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              editable={!busy}
              returnKeyType="done"
              onSubmitEditing={submit}
            />

            <Pressable
              style={styles.stepButton}
              onPress={() => change(1)}
              disabled={busy}
              hitSlop={8}
            >
              <Ionicons name="add" size={26} color={COLORS.primary} />
            </Pressable>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.primary, busy && styles.disabled]}
            onPress={submit}
            disabled={busy}
          >
            <Text style={styles.primaryText}>{t("pallets.modalConfirm")}</Text>
          </Pressable>

          <Pressable
            style={[styles.secondary, busy && styles.disabled]}
            onPress={onCancel}
            disabled={busy}
          >
            <Text style={styles.secondaryText}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  message: {
    fontSize: 14,
    color: "#667085",
    lineHeight: 20,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: "#667085",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: 100,
    textAlign: "center",
    fontSize: 40,
    fontWeight: "800",
    color: COLORS.text,
    marginHorizontal: 12,
  },
  error: {
    color: "#B42318",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
  },
  primary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: 18,
  },
  primaryText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondary: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 15,
  },
  disabled: {
    opacity: 0.6,
  },
});