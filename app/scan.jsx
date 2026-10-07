import React, { useCallback, useRef, useState } from "react";
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
import { registerProduct, scanProduct } from "../services/productService";

// Tiempo de espera entre lecturas para no contar dos veces el mismo código
const COOLDOWN_MS = 1500;
const BANNER_MS = 2500;
// Tras registrar o cancelar un producto nuevo, se ignora ese mismo código
// este tiempo, para que no se cuente sin querer mientras la cámara lo sigue viendo
const IGNORE_AFTER_REGISTER_MS = 4000;
const IGNORE_AFTER_CANCEL_MS = 4000;
const REGISTER_BANNER_MS = 4000;

export default function ScanScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [banner, setBanner] = useState(null);

  // Producto nuevo pendiente de registrar: { productNumber }
  const [pending, setPending] = useState(null);
  const [description, setDescription] = useState("");
  const [registering, setRegistering] = useState(false);

  const scanLock = useRef(false);
  const [scanning, setScanning] = useState(false);
  const unlockTimer = useRef(null);
  const bannerTimer = useRef(null);
  const ignoredRef = useRef({ code: null, until: 0 });

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

  const showBanner = useCallback((title, subtitle, duration = BANNER_MS) => {
    setBanner({ title, subtitle });
    clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), duration);
  }, []);

  if (!permission) {
    return <View style={styles.centerContainer} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={60} color={COLORS.primary} />
        <Text style={styles.permissionText}>
          Necesitamos acceso a la cámara para poder escanear los códigos QR.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder permiso</Text>
        </Pressable>
      </View>
    );
  }

  const goToList = () => router.navigate("/list");

  const showFinalizedAlert = (message) => {
    Alert.alert(
      "Lista finalizada",
      message,
      [
        { text: "Ver mi lista", onPress: goToList },
        { text: "Cerrar", style: "cancel", onPress: unlock },
      ],
      { cancelable: false },
    );
  };

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
        // registrar la descripción o cancelar.
        setDescription("");
        setPending({ productNumber: res.productNumber });
        return;
      }

      showBanner(
        res.product.name || res.productNumber,
        `En tu lista: ${res.countQuantity}`,
      );
      unlockLater();
    } catch (error) {
      console.error("Error al procesar el código:", error);

      if (error?.code === "list-finalized") {
        showFinalizedAlert(error.message);
        return;
      }

      const message =
        error?.code === "permission-denied"
          ? "Firestore rechazó la operación. Verificá tu sesión y las reglas."
          : "Ocurrió un problema al procesar el código.";
      Alert.alert("Error", message, [{ text: "Reintentar", onPress: unlock }], {
        cancelable: false,
      });
    }
  };

  const handleRegister = async () => {
    if (!pending || registering) return;

    const code = pending.productNumber;
    const name = description.trim();

    if (!name) {
      Alert.alert(
        "Falta la descripción",
        "Escribí la descripción del producto para poder registrarlo.",
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
          ? "Ya estaba registrado. Escanealo de nuevo para sumarlo."
          : "Registrado. Escanealo de nuevo para sumarlo a tu lista.",
        REGISTER_BANNER_MS,
      );
      unlockLater();
    } catch (error) {
      console.error("Error al registrar el producto:", error);

      // El cuadro queda abierto: no se registró nada
      Alert.alert(
        "No se pudo registrar",
        error?.code === "permission-denied"
          ? "Firestore rechazó la operación. Verificá tu sesión y las reglas."
          : "Ocurrió un problema y el producto no se registró.",
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
    showBanner("Producto nuevo cancelado", "No se registró ni se sumó");
    unlockLater();
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={styles.fill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
          onMountError={(e) => {
            console.error("Error al montar la cámara:", e);
            setCameraError(e?.message || "No se pudo iniciar la cámara.");
          }}
          onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "code128", "code39", "ean13", "ean8"],
          }}
        />
      )}

      <View style={[styles.fill, styles.overlay]} pointerEvents="box-none">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Escaneando Código</Text>
        </View>

        <View style={styles.targetContainer} pointerEvents="none">
          <View style={styles.targetFrame} />
          <Text style={styles.instructionText}>
            {cameraError
              ? cameraError
              : cameraReady
                ? "Apuntá al código de barras o QR"
                : "Iniciando cámara..."}
          </Text>
        </View>

        <View style={styles.footer} pointerEvents="box-none">
          {banner && (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {banner.title}
              </Text>
              <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
            </View>
          )}
          <Pressable style={styles.listButton} onPress={goToList}>
            <Ionicons name="list" size={20} color="#FFF" />
            <Text style={styles.listButtonText}>Ver mi lista</Text>
          </Pressable>
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
            <Text style={styles.modalTitle}>✨ Producto nuevo</Text>
            <Text style={styles.modalText}>
              Este código no está registrado. Escribí la descripción para darlo
              de alta. Registrarlo no lo suma a tu lista: después escanealo de
              nuevo para contarlo.
            </Text>

            <Text style={styles.modalLabel}>Código leído</Text>
            <Text style={styles.modalCode} numberOfLines={2}>
              {pending?.productNumber}
            </Text>

            <Text style={styles.modalLabel}>Descripción</Text>
            <TextInput
              style={styles.modalInput}
              value={description}
              onChangeText={(text) => setDescription(text.toUpperCase())}
              placeholder="DESCRIPCIÓN DEL PRODUCTO"
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              maxLength={80}
              editable={!registering}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <Pressable
              style={[
                styles.modalPrimary,
                registering && styles.modalDisabled,
              ]}
              onPress={handleRegister}
              disabled={registering}
            >
              {registering ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.modalPrimaryText}>Registrar</Text>
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
              <Text style={styles.modalSecondaryText}>Cancelar</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
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
  targetContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  targetFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    backgroundColor: "transparent",
  },
  instructionText: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
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
  listButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  listButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
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
    fontSize: 15,
    fontWeight: "700",
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
  modalPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: 18,
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