// import React, { useRef, useState } from "react";
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
// import { router } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { COLORS, RADIUS } from "../constants/theme";
// import { useAuth } from "../context/AuthContext";
// import {
//   changePassword,
//   passwordErrorMessage,
// } from "../services/accountService";

// const MIN_LENGTH = 6;

// export default function ChangePasswordScreen() {
//   const { user } = useAuth();
//   const [current, setCurrent] = useState("");
//   const [next, setNext] = useState("");
//   const [confirm, setConfirm] = useState("");
//   const [showPasswords, setShowPasswords] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState(null);

//   const nextRef = useRef(null);
//   const confirmRef = useRef(null);

//   const validate = () => {
//     if (!current) return "Ingresá tu contraseña actual.";
//     if (next.length < MIN_LENGTH) {
//       return `La nueva contraseña debe tener al menos ${MIN_LENGTH} caracteres.`;
//     }
//     if (next === current) {
//       return "La nueva contraseña debe ser distinta de la actual.";
//     }
//     if (next !== confirm) return "Las contraseñas nuevas no coinciden.";
//     return null;
//   };

//   const handleSubmit = async () => {
//     if (saving) return;

//     const problem = validate();
//     if (problem) {
//       setError(problem);
//       return;
//     }

//     setError(null);
//     setSaving(true);
//     try {
//       await changePassword(current, next);
//       setCurrent("");
//       setNext("");
//       setConfirm("");
//       Alert.alert(
//         "✅ Contraseña actualizada",
//         "Ya podés usar tu nueva contraseña la próxima vez que ingreses.",
//         [{ text: "OK", onPress: () => router.back() }],
//       );
//     } catch (err) {
//       console.error("Error al cambiar la contraseña:", err);
//       setError(passwordErrorMessage(err));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const renderField = ({
//     label,
//     value,
//     onChange,
//     inputRef,
//     onSubmit,
//     returnKeyType,
//     textContentType,
//     autoComplete,
//   }) => (
//     <>
//       <Text style={styles.label}>{label}</Text>
//       <TextInput
//         ref={inputRef}
//         style={styles.input}
//         value={value}
//         onChangeText={(text) => {
//           setError(null);
//           onChange(text);
//         }}
//         secureTextEntry={!showPasswords}
//         autoCapitalize="none"
//         autoCorrect={false}
//         editable={!saving}
//         returnKeyType={returnKeyType}
//         onSubmitEditing={onSubmit}
//         textContentType={textContentType}
//         autoComplete={autoComplete}
//       />
//     </>
//   );

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
//           <Text style={styles.title}>Cambiar contraseña</Text>
//         </View>

//         <View style={styles.infoBox}>
//           <Text style={styles.infoLabel}>Cuenta</Text>
//           <Text style={styles.infoValue}>{user?.email}</Text>
//         </View>

//         {renderField({
//           label: "Contraseña actual",
//           value: current,
//           onChange: setCurrent,
//           onSubmit: () => nextRef.current?.focus(),
//           returnKeyType: "next",
//           textContentType: "password",
//           autoComplete: "current-password",
//         })}

//         {renderField({
//           label: "Nueva contraseña",
//           value: next,
//           onChange: setNext,
//           inputRef: nextRef,
//           onSubmit: () => confirmRef.current?.focus(),
//           returnKeyType: "next",
//           textContentType: "newPassword",
//           autoComplete: "new-password",
//         })}

//         {renderField({
//           label: "Repetir nueva contraseña",
//           value: confirm,
//           onChange: setConfirm,
//           inputRef: confirmRef,
//           onSubmit: handleSubmit,
//           returnKeyType: "done",
//           textContentType: "newPassword",
//           autoComplete: "new-password",
//         })}

//         <Pressable
//           style={styles.toggle}
//           onPress={() => setShowPasswords((value) => !value)}
//         >
//           <Ionicons
//             name={showPasswords ? "eye-off-outline" : "eye-outline"}
//             size={18}
//             color={COLORS.primary}
//           />
//           <Text style={styles.toggleText}>
//             {showPasswords ? "Ocultar contraseñas" : "Mostrar contraseñas"}
//           </Text>
//         </Pressable>

//         {error && <Text style={styles.errorText}>{error}</Text>}

//         <Pressable
//           style={[styles.primaryButton, saving && styles.buttonDisabled]}
//           onPress={handleSubmit}
//           disabled={saving}
//         >
//           {saving ? (
//             <ActivityIndicator color="#FFF" />
//           ) : (
//             <Text style={styles.primaryButtonText}>Cambiar contraseña</Text>
//           )}
//         </Pressable>
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
//     marginBottom: 8,
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
//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: COLORS.text,
//     marginTop: 14,
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
//   toggle: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 14,
//   },
//   toggleText: {
//     color: COLORS.primary,
//     fontWeight: "600",
//     fontSize: 14,
//     marginLeft: 6,
//   },
//   errorText: {
//     color: "#B42318",
//     fontSize: 14,
//     marginTop: 14,
//     lineHeight: 20,
//   },
//   primaryButton: {
//     backgroundColor: COLORS.primary,
//     paddingVertical: 14,
//     borderRadius: RADIUS.md,
//     alignItems: "center",
//     marginTop: 24,
//   },
//   primaryButtonText: {
//     color: "#FFF",
//     fontWeight: "700",
//     fontSize: 16,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
// });


import React, { useRef, useState } from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import {
  changePassword,
  passwordErrorMessage,
} from "../services/accountService";
import { useTranslation } from "react-i18next";

const MIN_LENGTH = 6;

export default function ChangePasswordScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const nextRef = useRef(null);
  const confirmRef = useRef(null);

  const validate = () => {
    if (!current) return t("changePassword.errors.currentRequired");

    if (next.length < MIN_LENGTH) {
      return t("changePassword.errors.minLength", {
        length: MIN_LENGTH,
      });
    }

    if (next === current) {
      return t("changePassword.errors.samePassword");
    }

    if (next !== confirm) {
      return t("changePassword.errors.notMatch");
    }

    return null;
  };

  const handleSubmit = async () => {
    if (saving) return;

    const problem = validate();

    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await changePassword(current, next);

      setCurrent("");
      setNext("");
      setConfirm("");

      Alert.alert(
        t("changePassword.alerts.successTitle"),
        t("changePassword.alerts.successMessage"),
        [
          {
            text: t("common.ok"),
            onPress: () => router.back(),
          },
        ],
      );
    } catch (err) {
      console.error(
        t("changePassword.errors.changeConsole"),
        err,
      );

      setError(passwordErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const renderField = ({
    label,
    value,
    onChange,
    inputRef,
    onSubmit,
    returnKeyType,
    textContentType,
    autoComplete,
  }) => (
    <>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={(text) => {
          setError(null);
          onChange(text);
        }}
        secureTextEntry={!showPasswords}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmit}
        textContentType={textContentType}
        autoComplete={autoComplete}
      />
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            {t("changePassword.title")}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>
            {t("changePassword.account")}
          </Text>

          <Text style={styles.infoValue}>
            {user?.email}
          </Text>
        </View>

        {renderField({
          label: t("changePassword.currentPassword"),
          value: current,
          onChange: setCurrent,
          onSubmit: () => nextRef.current?.focus(),
          returnKeyType: "next",
          textContentType: "password",
          autoComplete: "current-password",
        })}

        {renderField({
          label: t("changePassword.newPassword"),
          value: next,
          onChange: setNext,
          inputRef: nextRef,
          onSubmit: () => confirmRef.current?.focus(),
          returnKeyType: "next",
          textContentType: "newPassword",
          autoComplete: "new-password",
        })}

        {renderField({
          label: t("changePassword.confirmPassword"),
          value: confirm,
          onChange: setConfirm,
          inputRef: confirmRef,
          onSubmit: handleSubmit,
          returnKeyType: "done",
          textContentType: "newPassword",
          autoComplete: "new-password",
        })}

        <Pressable
          style={styles.toggle}
          onPress={() =>
            setShowPasswords((value) => !value)
          }
        >
          <Ionicons
            name={
              showPasswords
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={18}
            color={COLORS.primary}
          />

          <Text style={styles.toggleText}>
            {showPasswords
              ? t("changePassword.hidePasswords")
              : t("changePassword.showPasswords")}
          </Text>
        </Pressable>

        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

        <Pressable
          style={[
            styles.primaryButton,
            saving && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {t("changePassword.changeButton")}
            </Text>
          )}
        </Pressable>
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
    marginBottom: 8,
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

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 14,
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

  toggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  toggleText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },

  errorText: {
    color: "#B42318",
    fontSize: 14,
    marginTop: 14,
    lineHeight: 20,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: 24,
  },

  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});
