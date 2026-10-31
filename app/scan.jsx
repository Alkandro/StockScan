import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import {
  checkNewProduct,
  registerProduct,
  scanProduct,
} from "../services/productService";
import {
  formatPalletBreakdown,
  movePallet,
  palletEntries,
} from "../services/countService";
import { useListState } from "../services/useListState";
import { useTranslation } from "react-i18next";

// Tiempo de espera entre lecturas para no contar dos veces el mismo código
const COOLDOWN_MS = 1500;
const BANNER_MS = 2500;
// El aviso de "está en varios palets" dura más para que se alcance a leer
const WARN_BANNER_MS = 5000;

// Tras registrar o cancelar un producto nuevo, se ignora ese mismo código
// este tiempo, para que no se cuente sin querer mientras la cámara lo sigue viendo
const IGNORE_AFTER_REGISTER_MS = 4000;
const IGNORE_AFTER_CANCEL_MS = 4000;
const REGISTER_BANNER_MS = 4000;

export default function ScanScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { session, totals, loaded } = useListState(user?.uid);
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [banner, setBanner] = useState(null);

  // Producto nuevo pendiente de registrar: { productNumber, detected }
  const [pending, setPending] = useState(null);
  const [description, setDescription] = useState("");
  const [registering, setRegistering] = useState(false);
  // Comparación con la base: null si se puede registrar, o el producto que ya existe
  const [conflict, setConflict] = useState(null);

  const scanLock = useRef(false);
  const [scanning, setScanning] = useState(false);
  const unlockTimer = useRef(null);
  const bannerTimer = useRef(null);
  const ignoredRef = useRef({ code: null, until: 0 });

  // Compara con la base cada vez que cambia el producto nuevo o su nombre
  useEffect(() => {
    if (!pending) {
      setConflict(null);
      return undefined;
    }

    let active = true;

    checkNewProduct(pending.productNumber, description)
      .then((result) => {
        if (active) setConflict(result);
      })
      .catch(() => {
        if (active) setConflict(null);
      });

    return () => {
      active = false;
    };
  }, [pending, description]);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      setCameraReady(false);
      setCameraError(null);
      setBanner(null);
      setPending(null);
      setDescription("");
      setRegistering(false);
      scanLock.current = false;
      setScanning(false);

      return () => {
        clearTimeout(unlockTimer.current);
        clearTimeout(bannerTimer.current);
        setIsFocused(false);
        setCameraReady(false);
      };
    }, []),
  );

  const unlock = useCallback(() => {
    scanLock.current = false;
    setScanning(false);
  }, []);

  const unlockLater = useCallback(() => {
    clearTimeout(unlockTimer.current);
    unlockTimer.current = setTimeout(unlock, COOLDOWN_MS);
  }, [unlock]);

  const showBanner = useCallback(
    (title, subtitle, duration = BANNER_MS, tone = "ok") => {
      setBanner({ title, subtitle, tone });
      clearTimeout(bannerTimer.current);
      bannerTimer.current = setTimeout(() => setBanner(null), duration);
    },
    [],
  );

  if (!permission) {
    return <View style={styles.centerContainer} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={60} color={COLORS.primary} />

        <Text style={styles.permissionText}>{t("scan.permissionMessage")}</Text>

        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t("scan.grantPermission")}</Text>
        </Pressable>
      </View>
    );
  }

  if (!loaded) {
    return <View style={styles.container} />;
  }

  // Sin conteo por palets no se puede escanear: primero hay que tocar "Comenzar"
  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="layers-outline" size={60} color={COLORS.primary} />

        <Text style={styles.noSessionTitle}>{t("pallets.noSessionTitle")}</Text>
        <Text style={styles.permissionText}>{t("pallets.noSession")}</Text>

        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>{t("pallets.back")}</Text>
        </Pressable>
      </View>
    );
  }

  const isLastPallet = session.currentPallet >= session.totalPallets;

  const goToList = () => router.navigate("/list");

  const handleBarcodeScanned = async ({ data }) => {
    if (scanLock.current) return;

    const code = String(data || "").trim();
    if (!code) return;

    // Código recién registrado o cancelado: se ignora unos segundos
    if (
      ignoredRef.current.code === code &&
      Date.now() < ignoredRef.current.until
    ) {
      return;
    }

    scanLock.current = true;
    setScanning(true);

    try {
      const res = await scanProduct(code, user.uid);

      if (res.state === "unregistered") {
        // No se crea ni se suma nada. El escáner queda bloqueado hasta
        // confirmar el registro o cancelar. Si se reconoce el modelo del código,
        // el nombre se completa solo (sin espacios).
        setDescription(res.suggestedName || "");
        setPending({
          productNumber: res.productNumber,
          detected: Boolean(res.suggestedName),
        });
        return;
      }

      const entries = palletEntries({
        pallets: res.pallets,
        quantity: res.countQuantity,
      });
      const inSeveralPallets = entries.length > 1;

      showBanner(
        res.product.name || res.productNumber,
        inSeveralPallets
          ? t("pallets.multiBanner", {
              total: res.countQuantity,
              detail: formatPalletBreakdown(entries, t),
            })
          : t("scan.banner.inList", {
              count: res.countQuantity,
            }),
        inSeveralPallets ? WARN_BANNER_MS : BANNER_MS,
        inSeveralPallets ? "warn" : "ok",
      );

      unlockLater();
    } catch (error) {
      console.error(t("scan.errors.processConsole"), error);

      if (error?.code === "no-pallet-session") {
        Alert.alert(
          t("pallets.noSessionTitle"),
          t("pallets.noSession"),
          [{ text: t("pallets.back"), onPress: () => router.back() }],
          { cancelable: false },
        );
        return;
      }

      const message =
        error?.code === "permission-denied"
          ? t("scan.errors.permissionDenied")
          : t("scan.errors.process");

      Alert.alert(
        t("common.error"),
        message,
        [
          {
            text: t("scan.alerts.retry"),
            onPress: unlock,
          },
        ],
        {
          cancelable: false,
        },
      );
    }
  };

  const handleRegister = async () => {
    if (!pending || registering || conflict) return;

    const code = pending.productNumber;
    const name = description.trim();

    if (!name) {
      Alert.alert(
        t("scan.alerts.missingDescriptionTitle"),
        t("scan.alerts.missingDescriptionMessage"),
      );
      return;
    }

    setRegistering(true);

    try {
      const res = await registerProduct(code, name, user.uid);

      // Registrar NO suma a la lista. Se ignora este código unos segundos
      // para que no se cuente sin querer mientras la cámara lo sigue viendo.
      ignoredRef.current = {
        code,
        until: Date.now() + IGNORE_AFTER_REGISTER_MS,
      };

      setPending(null);
      setDescription("");

      showBanner(
        res.name || code,
        res.alreadyRegistered
          ? t("scan.banner.alreadyRegistered")
          : t("scan.banner.registered"),
        REGISTER_BANNER_MS,
      );

      unlockLater();
    } catch (error) {
      // Esa descripción ya existe en otro código: el cuadro queda abierto
      // para que la corrijan o cancelen
      if (error?.code === "duplicate-description") {
        Alert.alert(t("pallets.duplicateTitle"), error.message);
        return;
      }

      console.error(t("scan.errors.registerConsole"), error);

      // El cuadro queda abierto: no se registró nada
      Alert.alert(
        t("scan.alerts.registerErrorTitle"),
        error?.code === "permission-denied"
          ? t("scan.errors.permissionDenied")
          : t("scan.errors.register"),
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelPending = () => {
    if (registering) return;

    ignoredRef.current = {
      code: pending?.productNumber ?? null,
      until: Date.now() + IGNORE_AFTER_CANCEL_MS,
    };

    setPending(null);
    setDescription("");

    showBanner(
      t("scan.banner.cancelledTitle"),
      t("scan.banner.cancelledSubtitle"),
    );

    unlockLater();
  };

  const changePallet = async (delta) => {
    try {
      const next = await movePallet(user.uid, delta);
      showBanner(t("pallets.label", { n: next }), "");
    } catch (error) {
      console.error(t("scan.errors.processConsole"), error);
    }
  };

  const handleNextPallet = () => {
    // Último palet: se pasa a la lista con la confirmación para finalizar
    if (isLastPallet) {
      router.navigate({ pathname: "/list", params: { finalize: "1" } });
      return;
    }

    if (totals.palletUnits === 0) {
      Alert.alert(
        t("pallets.emptyPalletTitle"),
        t("pallets.emptyPalletMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("pallets.emptyPalletConfirm"),
            onPress: () => changePallet(1),
          },
        ],
      );
      return;
    }

    changePallet(1);
  };

  const hasName = description.trim().length > 0;
  const canConfirm = hasName && !conflict && !registering;

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={styles.fill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
          onMountError={(e) => {
            console.error(t("scan.errors.cameraConsole"), e);

            setCameraError(e?.message || t("scan.errors.cameraStart"));
          }}
          onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "code128", "code39", "ean13", "ean8"],
          }}
        />
      )}

      <View style={[styles.fill, styles.overlay]} pointerEvents="box-none">
        <View style={styles.topArea} pointerEvents="box-none">
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </Pressable>

            <Text style={styles.headerTitle}>{t("scan.title")}</Text>
          </View>

          {/* Palet en curso y cantidad de la lista, en grande */}
          <View style={styles.hud} pointerEvents="box-none">
            <View style={styles.palletRow} pointerEvents="box-none">
              {session.currentPallet > 1 && (
                <Pressable
                  style={styles.prevButton}
                  onPress={() => changePallet(-1)}
                  hitSlop={10}
                >
                  <Ionicons name="chevron-back" size={20} color="#FFF" />
                </Pressable>
              )}

              <Text style={styles.palletLabel}>
                {t("pallets.ofTotal", {
                  current: session.currentPallet,
                  total: session.totalPallets,
                })}
              </Text>
            </View>

            <View style={styles.hudNumberBox} pointerEvents="none">
              <Text style={styles.hudNumber}>{totals.units}</Text>
              <Text style={styles.hudLabel}>{t("pallets.hudTotal")}</Text>
            </View>

            <Text style={styles.hudPallet} pointerEvents="none">
              {t("pallets.hudPallet", { count: totals.palletUnits })}
            </Text>
          </View>
        </View>

        <View style={styles.targetContainer} pointerEvents="none">
          <View style={styles.targetFrame} />

          <Text style={styles.instructionText}>
            {cameraError
              ? cameraError
              : cameraReady
                ? t("scan.instructions.ready")
                : t("scan.instructions.starting")}
          </Text>
        </View>

        <View style={styles.footer} pointerEvents="box-none">
          {banner && (
            <View
              style={[
                styles.banner,
                banner.tone === "warn" && styles.bannerWarn,
              ]}
            >
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {banner.title}
              </Text>

              {banner.subtitle ? (
                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
              ) : null}
            </View>
          )}

          <View style={styles.footerButtons}>
            <Pressable style={styles.listButton} onPress={goToList}>
              <Ionicons name="list" size={20} color="#FFF" />

              <Text style={styles.listButtonText}>{t("scan.viewList")}</Text>
            </Pressable>

            <Pressable style={styles.nextButton} onPress={handleNextPallet}>
              <Ionicons
                name={
                  isLastPallet
                    ? "checkmark-circle-outline"
                    : "arrow-forward-circle-outline"
                }
                size={20}
                color="#FFF"
              />

              <Text style={styles.nextButtonText} numberOfLines={1}>
                {isLastPallet ? t("pallets.finish") : t("pallets.next")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={pending !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelPending}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("scan.newProductTitle")}</Text>

            <Text style={styles.modalText}>
              {pending?.detected
                ? t("pallets.detectedMessage")
                : t("scan.newProductMessage")}
            </Text>

            <Text style={styles.modalLabel}>{t("scan.productCode")}</Text>

            <Text style={styles.modalCode} numberOfLines={2}>
              {pending?.productNumber}
            </Text>

            <Text style={styles.modalLabel}>
              {pending?.detected
                ? t("pallets.detectedModel")
                : t("scan.description")}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                pending?.detected && styles.modalInputDetected,
              ]}
              value={description}
              onChangeText={(text) => setDescription(text.toUpperCase())}
              placeholder={t("scan.descriptionPlaceholder")}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus={!pending?.detected}
              maxLength={80}
              editable={!registering}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            {/* Resultado de comparar con la base */}
            {hasName ? (
              conflict ? (
                <Text style={styles.statusBad}>
                  ✕{" "}
                  {t("pallets.existsInDb", {
                    name: conflict.name || conflict.code,
                  })}
                </Text>
              ) : (
                <Text style={styles.statusOk}>✓ {t("pallets.notInDb")}</Text>
              )
            ) : null}

            <Pressable
              style={[
                styles.modalPrimary,
                !canConfirm && styles.modalPrimaryDisabled,
              ]}
              onPress={handleRegister}
              disabled={!canConfirm}
            >
              {registering ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.modalPrimaryText}>
                  {t("pallets.confirmRegister")}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.modalSecondary,
                registering && styles.modalDisabled,
              ]}
              onPress={handleCancelPending}
              disabled={registering}
            >
              <Text style={styles.modalSecondaryText}>
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  noSessionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 14,
    textAlign: "center",
  },

  permissionText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    marginVertical: 18,
    lineHeight: 22,
  },

  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  overlay: {
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 32,
  },

  topArea: {
    alignItems: "stretch",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 16,
  },

  hud: {
    alignItems: "center",
    marginTop: 4,
  },

  palletRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  prevButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  palletLabel: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: "hidden",
  },

  hudNumberBox: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 6,
    marginTop: 8,
    minWidth: 150,
  },

  hudNumber: {
    color: "#FFF",
    fontSize: 58,
    lineHeight: 64,
    fontWeight: "900",
  },

  hudLabel: {
    color: "#DCEBFF",
    fontSize: 13,
    fontWeight: "700",
  },

  hudPallet: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },

  targetContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  targetFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    backgroundColor: "transparent",
  },

  instructionText: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },

  footer: {
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 110,
    justifyContent: "flex-end",
  },

  banner: {
    backgroundColor: "rgba(22,163,74,0.95)",
    borderRadius: RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 12,
    alignItems: "center",
    maxWidth: "100%",
  },

  bannerWarn: {
    backgroundColor: "rgba(217,119,6,0.97)",
  },

  bannerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  bannerSubtitle: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 2,
    textAlign: "center",
  },

  footerButtons: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },

  listButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    paddingVertical: 13,
    borderRadius: RADIUS.md,
  },

  listButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 6,
  },

  nextButton: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
  },

  nextButtonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
    marginLeft: 6,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  modalText: {
    fontSize: 14,
    color: "#667085",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 12,
  },

  modalLabel: {
    fontSize: 12,
    color: "#667085",
    marginTop: 8,
    marginBottom: 4,
  },

  modalCode: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },

  modalInputDetected: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    borderColor: COLORS.primary,
    backgroundColor: "#F5F9FF",
  },

  statusOk: {
    color: "#067647",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },

  statusBad: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },

  modalPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: 18,
  },

  modalPrimaryDisabled: {
    opacity: 0.4,
  },

  modalPrimaryText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  modalSecondary: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: 10,
  },

  modalSecondaryText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 15,
  },

  modalDisabled: {
    opacity: 0.6,
  },
});