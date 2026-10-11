import NetInfo from "@react-native-community/netinfo";

function isReachable(state) {
  return state.isConnected === true && state.isInternetReachable !== false;
}

/** true si el celular tiene conexión a internet. */
export async function isOnline() {
  try {
    return isReachable(await NetInfo.fetch());
  } catch (error) {
    return false;
  }
}

/** Avisa cuando cambia la conexión. Devuelve la función para cancelar. */
export function subscribeToConnection(callback) {
  return NetInfo.addEventListener((state) => callback(isReachable(state)));
}

/** Corta la espera si una operación tarda demasiado (señal muy débil). */
export function withTimeout(promise, ms) {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error("timeout");
      err.code = "timeout";
      reject(err);
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
