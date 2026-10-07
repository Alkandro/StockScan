// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
// } from "react-native";
// import { router, useLocalSearchParams } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { COLORS, RADIUS } from "../constants/theme";
// import { useAuth } from "../context/AuthContext";
// import {
//   getProductById,
//   isAdminUser,
//   saveProductFields,
// } from "../services/productService";

// export default function ProductFormScreen() {
//   const params = useLocalSearchParams();
//   const productId = Array.isArray(params.id) ? params.id[0] : params.id;
//   const { user } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [editing, setEditing] = useState(false);
//   const [loadError, setLoadError] = useState(null);
//   const [product, setProduct] = useState(null);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [description, setDescription] = useState("");

//   useEffect(() => {
//     let active = true;

//     (async () => {
//       try {
//         const admin = await isAdminUser(user?.uid);
//         if (!active) return;
//         setIsAdmin(admin);

//         // Los usuarios comunes no cargan nada de esta pantalla
//         if (!admin) return;

//         const loaded = await getProductById(productId);
//         if (!active) return;

//         if (!loaded) {
//           setLoadError("No se encontró el producto.");
//           return;
//         }

//         setProduct(loaded);
//         setDescription(String(loaded.name ?? "").toUpperCase());
//       } catch (error) {
//         console.error("Error al cargar el producto:", error);
//         if (active) setLoadError("No se pudo cargar el producto.");
//       } finally {
//         if (active) setLoading(false);
//       }
//     })();

//     return () => {
//       active = false;
//     };
//   }, [productId, user?.uid]);

//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   if (!isAdmin) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>
//           Esta sección es solo para el administrador.
//         </Text>
//         <Pressable style={styles.primaryButton} onPress={() => router.back()}>
//           <Text style={styles.primaryButtonText}>Volver</Text>
//         </Pressable>
//       </View>
//     );
//   }

//   if (loadError || !product) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>
//           {loadError || "No se encontró el producto."}
//         </Text>
//         <Pressable style={styles.primaryButton} onPress={() => router.back()}>
//           <Text style={styles.primaryButtonText}>Volver</Text>
//         </Pressable>
//       </View>
//     );
//   }

//   const isDraft = (product.status || "registered") === "draft";

//   const handleStartEditing = () => setEditing(true);

//   const handleCancelEditing = () => {
//     if (saving) return;
//     setDescription(String(product.name ?? "").toUpperCase());
//     setEditing(false);
//   };

//   const handleSave = async () => {
//     if (saving) return;

//     const name = description.trim().toUpperCase();
//     if (!name) {
//       Alert.alert(
//         "Falta la descripción",
//         "La descripción no puede quedar vacía.",
//       );
//       return;
//     }

//     setSaving(true);
//     try {
//       // Si era un borrador viejo, al guardar queda registrado
//       const res = await saveProductFields(productId, { name }, user.uid, {
//         confirm: isDraft,
//       });

//       if (!res.success) {
//         Alert.alert("No se pudo guardar", res.message);
//         return;
//       }

//       setProduct((prev) => ({
//         ...prev,
//         name,
//         status: isDraft ? "registered" : prev.status,
//       }));
//       setDescription(name);
//       setEditing(false);
//       Alert.alert("Guardado", "Los cambios se guardaron correctamente.");
//     } catch (error) {
//       console.error("Error al guardar el producto:", error);
//       Alert.alert("Error", "Ocurrió un problema al guardar el producto.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const statusLabel = isDraft ? "Sin registrar (borrador)" : "Registrado";

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
//       <ScrollView
//         contentContainerStyle={styles.content}
//         keyboardShouldPersistTaps="handled"
//       >
//         <View style={styles.header}>
//           <Pressable onPress={() => router.back()} style={styles.backButton}>
//             <Ionicons name="chevron-back" size={26} color={COLORS.text} />
//           </Pressable>
//           <Text style={styles.title}>Producto</Text>
//         </View>

//         <View style={styles.infoBox}>
//           <Text style={styles.infoLabel}>Código leído</Text>
//           <Text style={styles.infoValue}>{product.productNumber}</Text>
//           <Text style={[styles.infoLabel, { marginTop: 10 }]}>Estado</Text>
//           <Text style={styles.infoValue}>{statusLabel}</Text>
//         </View>

//         {isDraft && (
//           <Text style={styles.notice}>
//             Este producto todavía no tiene alta. Al guardar la descripción
//             queda registrado.
//           </Text>
//         )}

//         <Text style={styles.label}>Descripción</Text>
//         <TextInput
//           style={[styles.input, !editing && styles.inputDisabled]}
//           value={description}
//           onChangeText={(text) => setDescription(text.toUpperCase())}
//           editable={editing && !saving}
//           autoCapitalize="characters"
//           autoCorrect={false}
//           maxLength={80}
//           placeholder="DESCRIPCIÓN DEL PRODUCTO"
//         />

//         {editing ? (
//           <>
//             <Pressable
//               style={[styles.primaryButton, saving && styles.buttonDisabled]}
//               onPress={handleSave}
//               disabled={saving}
//             >
//               {saving ? (
//                 <ActivityIndicator color="#FFF" />
//               ) : (
//                 <>
//                   <Ionicons name="save-outline" size={20} color="#FFF" />
//                   <Text style={styles.primaryButtonText}>Guardar</Text>
//                 </>
//               )}
//             </Pressable>

//             <Pressable
//               style={[styles.secondaryButton, saving && styles.buttonDisabled]}
//               onPress={handleCancelEditing}
//               disabled={saving}
//             >
//               <Text style={styles.secondaryButtonText}>Cancelar</Text>
//             </Pressable>
//           </>
//         ) : (
//           <Pressable style={styles.primaryButton} onPress={handleStartEditing}>
//             <Ionicons name="create-outline" size={20} color="#FFF" />
//             <Text style={styles.primaryButtonText}>Modificar</Text>
//           </Pressable>
//         )}
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   content: {
//     padding: 20,
//     paddingTop: 60,
//     paddingBottom: 40,
//   },
//   centerContainer: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 24,
//   },
//   errorText: {
//     fontSize: 16,
//     color: COLORS.text,
//     textAlign: "center",
//     marginBottom: 18,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 20,
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
//   infoBox: {
//     backgroundColor: "#FFF",
//     borderRadius: RADIUS.md,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: "#D0D5DD",
//     marginBottom: 16,
//   },
//   infoLabel: {
//     fontSize: 12,
//     color: "#667085",
//   },
//   infoValue: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: COLORS.text,
//   },
//   notice: {
//     fontSize: 14,
//     color: "#B54708",
//     marginBottom: 12,
//     lineHeight: 20,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: COLORS.text,
//     marginTop: 12,
//     marginBottom: 6,
//   },
//   input: {
//     backgroundColor: "#FFF",
//     borderWidth: 1,
//     borderColor: "#D0D5DD",
//     borderRadius: RADIUS.md,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: COLORS.text,
//   },
//   inputDisabled: {
//     backgroundColor: "#F2F4F7",
//     color: "#667085",
//   },
//   primaryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: COLORS.primary,
//     paddingVertical: 14,
//     borderRadius: RADIUS.md,
//     marginTop: 24,
//   },
//   primaryButtonText: {
//     color: "#FFF",
//     fontWeight: "700",
//     fontSize: 16,
//     marginLeft: 8,
//   },
//   secondaryButton: {
//     borderWidth: 1,
//     borderColor: COLORS.primary,
//     paddingVertical: 14,
//     borderRadius: RADIUS.md,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   secondaryButtonText: {
//     color: COLORS.primary,
//     fontWeight: "700",
//     fontSize: 16,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
// });

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import {
  getProductById,
  isAdminUser,
  saveProductFields,
} from "../services/productService";
import { useTranslation } from "react-i18next";

export default function ProductFormScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [product, setProduct] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const admin = await isAdminUser(user?.uid);

        if (!active) return;

        setIsAdmin(admin);

        // Los usuarios comunes no cargan nada de esta pantalla
        if (!admin) return;

        const loaded = await getProductById(productId);

        if (!active) return;

        if (!loaded) {
          setLoadError(t("productForm.errors.notFound"));
          return;
        }

        setProduct(loaded);
        setDescription(
          String(loaded.name ?? "").toUpperCase(),
        );
      } catch (error) {
        console.error(
          t("productForm.errors.loadConsole"),
          error,
        );

        if (active) {
          setLoadError(t("productForm.errors.load"));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [productId, user?.uid, t]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {t("productForm.adminOnly")}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>
            {t("productForm.back")}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (loadError || !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {loadError || t("productForm.errors.notFound")}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>
            {t("productForm.back")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const isDraft =
    (product.status || "registered") === "draft";

  const handleStartEditing = () => setEditing(true);

  const handleCancelEditing = () => {
    if (saving) return;

    setDescription(
      String(product.name ?? "").toUpperCase(),
    );

    setEditing(false);
  };

  const handleSave = async () => {
    if (saving) return;

    const name = description.trim().toUpperCase();

    if (!name) {
      Alert.alert(
        t("productForm.alerts.missingDescriptionTitle"),
        t("productForm.alerts.missingDescriptionMessage"),
      );
      return;
    }

    setSaving(true);

    try {
      // Si era un borrador viejo, al guardar queda registrado
      const res = await saveProductFields(
        productId,
        { name },
        user.uid,
        {
          confirm: isDraft,
        },
      );

      if (!res.success) {
        Alert.alert(
          t("productForm.alerts.saveErrorTitle"),
          res.message,
        );
        return;
      }

      setProduct((prev) => ({
        ...prev,
        name,
        status: isDraft
          ? "registered"
          : prev.status,
      }));

      setDescription(name);
      setEditing(false);

      Alert.alert(
        t("productForm.alerts.savedTitle"),
        t("productForm.alerts.savedMessage"),
      );
    } catch (error) {
      console.error(
        t("productForm.errors.saveConsole"),
        error,
      );

      Alert.alert(
        t("common.error"),
        t("productForm.errors.save"),
      );
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = isDraft
    ? t("productForm.status.draft")
    : t("productForm.status.registered");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={COLORS.text}
            />
          </Pressable>

          <Text style={styles.title}>
            {t("productForm.title")}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>
            {t("productForm.productCode")}
          </Text>

          <Text style={styles.infoValue}>
            {product.productNumber}
          </Text>

          <Text
            style={[
              styles.infoLabel,
              { marginTop: 10 },
            ]}
          >
            {t("productForm.statusLabel")}
          </Text>

          <Text style={styles.infoValue}>
            {statusLabel}
          </Text>
        </View>

        {isDraft && (
          <Text style={styles.notice}>
            {t("productForm.draftNotice")}
          </Text>
        )}

        <Text style={styles.label}>
          {t("productForm.description")}
        </Text>

        <TextInput
          style={[
            styles.input,
            !editing && styles.inputDisabled,
          ]}
          value={description}
          onChangeText={(text) =>
            setDescription(text.toUpperCase())
          }
          editable={editing && !saving}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={80}
          placeholder={t(
            "productForm.descriptionPlaceholder",
          )}
        />

        {editing ? (
          <>
            <Pressable
              style={[
                styles.primaryButton,
                saving && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color="#FFF"
                  />

                  <Text style={styles.primaryButtonText}>
                    {t("productForm.buttons.save")}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.secondaryButton,
                saving && styles.buttonDisabled,
              ]}
              onPress={handleCancelEditing}
              disabled={saving}
            >
              <Text style={styles.secondaryButtonText}>
                {t("common.cancel")}
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.primaryButton}
            onPress={handleStartEditing}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color="#FFF"
            />

            <Text style={styles.primaryButtonText}>
              {t("productForm.buttons.edit")}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  infoBox: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: "#667085",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  notice: {
    fontSize: 14,
    color: "#B54708",
    marginBottom: 12,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  inputDisabled: {
    backgroundColor: "#F2F4F7",
    color: "#667085",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    marginTop: 24,
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});