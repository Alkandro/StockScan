// import {
//   EmailAuthProvider,
//   getAuth,
//   reauthenticateWithCredential,
//   updatePassword,
// } from "firebase/auth";

// /**
//  * Cambia la contraseña del usuario que tiene la sesión abierta.
//  * Firebase exige reautenticar con la contraseña actual antes de cambiarla.
//  */
// export async function changePassword(currentPassword, newPassword) {
//   const currentUser = getAuth().currentUser;

//   if (!currentUser?.email) {
//     const err = new Error("No hay una sesión activa.");
//     err.code = "app/no-session";
//     throw err;
//   }

//   const credential = EmailAuthProvider.credential(
//     currentUser.email,
//     currentPassword,
//   );

//   await reauthenticateWithCredential(currentUser, credential);
//   await updatePassword(currentUser, newPassword);
// }

// /** Traduce los errores de Firebase Auth a un mensaje claro. */
// export function passwordErrorMessage(error) {
//   switch (error?.code) {
//     case "auth/wrong-password":
//     case "auth/invalid-credential":
//     case "auth/invalid-login-credentials":
//       return "La contraseña actual no es correcta.";
//     case "auth/weak-password":
//       return "La nueva contraseña es muy débil. Usá al menos 6 caracteres.";
//     case "auth/too-many-requests":
//       return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
//     case "auth/network-request-failed":
//       return "Sin conexión. Revisá tu internet e intentá de nuevo.";
//     case "auth/requires-recent-login":
//       return "Por seguridad, cerrá sesión, volvé a ingresar y reintentá.";
//     case "app/no-session":
//       return "No hay una sesión activa. Volvé a ingresar.";
//     default:
//       return "No se pudo cambiar la contraseña. Intentá de nuevo.";
//   }
// }
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import i18n from "i18next";

/**
 * Cambia la contraseña del usuario que tiene la sesión abierta.
 * Firebase exige reautenticar con la contraseña actual antes de cambiarla.
 */
export async function changePassword(currentPassword, newPassword) {
  const currentUser = getAuth().currentUser;

  if (!currentUser?.email) {
    const err = new Error(i18n.t("changePasswordService.errors.noSession"));

    err.code = "app/no-session";
    throw err;
  }

  const credential = EmailAuthProvider.credential(
    currentUser.email,
    currentPassword,
  );

  await reauthenticateWithCredential(currentUser, credential);

  await updatePassword(currentUser, newPassword);
}

/** Traduce los errores de Firebase Auth a un mensaje claro. */
export function passwordErrorMessage(error) {
  switch (error?.code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return i18n.t("changePasswordService.errors.wrongPassword");

    case "auth/weak-password":
      return i18n.t("changePasswordService.errors.weakPassword");

    case "auth/too-many-requests":
      return i18n.t("changePasswordService.errors.tooManyRequests");

    case "auth/network-request-failed":
      return i18n.t("changePasswordService.errors.network");

    case "auth/requires-recent-login":
      return i18n.t("changePasswordService.errors.recentLogin");

    case "app/no-session":
      return i18n.t("changePasswordService.errors.noSession");

    default:
      return i18n.t("changePasswordService.errors.default");
  }
}
