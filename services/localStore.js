import AsyncStorage from "@react-native-async-storage/async-storage";

export const LOCAL_KEYS = {
  catalog: "stockscan:catalog:v1",
  list: (userId) => `stockscan:list:${userId}:v1`,
};

// Valores iniciales de cada documento local
export const EMPTY = {
  catalog: () => ({ products: {}, lastSyncMs: null }),
  list: () => ({ items: {} }),
};

const cache = new Map(); // key -> valor en memoria
const loading = new Map(); // key -> lectura en curso
const chains = new Map(); // key -> cola para escribir de a una
const listeners = new Map(); // key -> Set de funciones

async function load(key, fallback) {
  if (cache.has(key)) return cache.get(key);
  if (loading.has(key)) return loading.get(key);

  const promise = (async () => {
    // Si falla la lectura del disco, se lanza el error: no se cachea un
    // valor vacío que después pisaría los datos guardados.
    const raw = await AsyncStorage.getItem(key);

    let value;
    try {
      value = raw ? JSON.parse(raw) : fallback();
    } catch (error) {
      console.warn("Datos locales dañados, se reinician:", key, error);
      value = fallback();
    }

    cache.set(key, value);
    return value;
  })();

  loading.set(key, promise);

  try {
    return await promise;
  } finally {
    loading.delete(key);
  }
}

function notify(key, value) {
  listeners.get(key)?.forEach((fn) => {
    try {
      fn(value);
    } catch (error) {
      console.warn("Error en un oyente local:", error);
    }
  });
}

/** Lee un documento local. No modificar el objeto devuelto. */
export function readLocal(key, fallback) {
  return load(key, fallback);
}

/**
 * Modifica un documento local de forma segura.
 * `mutator` recibe una copia, la cambia y puede devolver un resultado.
 * Si lanza un error, no se guarda nada. Las escrituras se hacen de a una.
 */
export function updateLocal(key, fallback, mutator) {
  const previous = chains.get(key) || Promise.resolve();

  const run = previous
    .catch(() => {})
    .then(async () => {
      const current = await load(key, fallback);
      const draft = JSON.parse(JSON.stringify(current));

      const result = mutator(draft);

      await AsyncStorage.setItem(key, JSON.stringify(draft));
      cache.set(key, draft);
      notify(key, draft);

      return result;
    });

  chains.set(key, run);
  return run;
}

/** Avisa cada vez que cambia el documento. Devuelve la función para cancelar. */
export function subscribeLocal(key, fallback, callback) {
  let set = listeners.get(key);

  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }

  set.add(callback);

  load(key, fallback)
    .then((value) => {
      if (set.has(callback)) callback(cache.get(key) ?? value);
    })
    .catch((error) => {
      console.warn("No se pudo leer el almacenamiento local:", error);
    });

  return () => {
    set.delete(callback);
  };
}
