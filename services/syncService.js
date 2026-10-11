import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { setListChangeHandler } from "./countService";
import { setHistoryChangeHandler, syncHistory } from "./historyService";
import { syncList } from "./listSync";
import { EMPTY, LOCAL_KEYS, readLocal, subscribeLocal } from "./localStore";
import { isOnline, subscribeToConnection, withTimeout } from "./network";
import {
  pullCatalog,
  pushPendingRegistrations,
  setPendingChangeHandler,
} from "./productService";

const STEP_TIMEOUT_MS = 30000;

// Segundos de calma después del último cambio antes de subir la lista sola.
// Con 0, la lista solo se sube al tocar Sincronizar, al abrir la app o al volver la conexión.
const LIST_UPLOAD_DELAY_MS = 20000;

let inFlight = null;
let rerunRequested = false;
let listUploading = false;
let listRerun = false;
let activeUserId = null;
let status = {
  syncing: false,
  online: true,
  pending: 0, // productos registrados en el celular sin subir
  historyPending: false, // cambios del historial sin subir
  listPending: false, // cambios de la lista sin subir
  lastSyncMs: null,
  lastError: null,
};
const listeners = new Set();

function setStatus(patch) {
  status = { ...status, ...patch };
  listeners.forEach((fn) => fn(status));
}

export function getSyncStatus() {
  return status;
}

export function subscribeToSyncStatus(callback) {
  listeners.add(callback);
  callback(status);

  return () => {
    listeners.delete(callback);
  };
}

/** Hook para mostrar el estado de la sincronización. */
export function useSyncStatus() {
  const [value, setValue] = useState(getSyncStatus());

  useEffect(() => subscribeToSyncStatus(setValue), []);

  return value;
}

async function refreshStatus() {
  const catalog = await readLocal(LOCAL_KEYS.catalog, EMPTY.catalog);

  let historyPending = false;
  let listPending = false;

  if (activeUserId) {
    const history = await readLocal(
      LOCAL_KEYS.history(activeUserId),
      EMPTY.history,
    );
    const list = await readLocal(LOCAL_KEYS.list(activeUserId), EMPTY.list);

    historyPending = Boolean(history.dirty);
    listPending = Boolean(list.dirty);
  }

  setStatus({
    pending: Object.values(catalog.products).filter((p) => p.pending).length,
    historyPending,
    listPending,
    lastSyncMs: catalog.lastSyncMs,
  });
}

/**
 * Sube lo pendiente y baja el catálogo; sincroniza la lista y el historial.
 * Si ya hay una sincronización en curso, pide una más al terminar.
 * Nunca lanza errores.
 */
export function syncNow(userId) {
  if (inFlight) {
    rerunRequested = true;
    return inFlight;
  }

  inFlight = (async () => {
    setStatus({ syncing: true, lastError: null });

    let failures = 0;
    let lastCode = null;
    let result = { pushed: 0, failed: 0 };

    // Cada paso es independiente: si uno falla, los demás igual se intentan
    const run = async (name, step) => {
      try {
        return await withTimeout(step(), STEP_TIMEOUT_MS);
      } catch (error) {
        failures += 1;
        lastCode = error?.code || "error";
        console.warn(
          `Falló la sincronización (${name}):`,
          error?.message || error,
          error?.stack,
        );
        return null;
      }
    };

    try {
      const online = await isOnline();
      setStatus({ online });

      if (!online) return { ok: false, reason: "offline" };

      const pushResult = await run("productos pendientes", () =>
        pushPendingRegistrations(userId),
      );
      if (pushResult) result = pushResult;

      await run("catálogo", () => pullCatalog());
      await run("lista", () => syncList(userId));
      await run("historial", () => syncHistory(userId));

      if (failures > 0) {
        setStatus({ lastError: lastCode });
        return { ok: false, reason: lastCode, ...result };
      }

      return { ok: true, ...result };
    } finally {
      inFlight = null;
      setStatus({ syncing: false });
      refreshStatus().catch(() => {});

      if (rerunRequested) {
        rerunRequested = false;
        setTimeout(() => syncNow(userId), 500);
      }
    }
  })();

  return inFlight;
}

/** Sube solo la lista (sin bajar el catálogo). Nunca lanza errores. */
async function uploadListOnly(userId) {
  if (inFlight) {
    // La sincronización completa en curso vuelve a correr al terminar
    rerunRequested = true;
    return;
  }

  if (listUploading) {
    listRerun = true;
    return;
  }

  listUploading = true;

  try {
    if (!(await isOnline())) return;
    await withTimeout(syncList(userId), STEP_TIMEOUT_MS);
  } catch (error) {
    console.warn(
      "No se pudo subir la lista:",
      error?.message || error,
      error?.stack,
    );
  } finally {
    listUploading = false;
    refreshStatus().catch(() => {});

    if (listRerun) {
      listRerun = false;
      setTimeout(() => uploadListOnly(userId), 1000);
    }
  }
}

/**
 * Activa la sincronización automática para el usuario.
 * Devuelve la función para desactivarla (usar como cleanup de useEffect).
 */
export function startAutoSync(userId) {
  if (!userId) return () => {};

  activeUserId = userId;
  let timer = null;
  let listTimer = null;

  const run = () => {
    syncNow(userId);
  };

  const runSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(run, 800);
  };

  // Después de unos segundos sin cambios en la lista, se sube sola
  const uploadListSoon = () => {
    if (!LIST_UPLOAD_DELAY_MS) return;

    clearTimeout(listTimer);
    listTimer = setTimeout(() => uploadListOnly(userId), LIST_UPLOAD_DELAY_MS);
  };

  // Al abrir la app
  run();

  // Al registrar un producto o cambiar el historial
  setPendingChangeHandler(runSoon);
  setHistoryChangeHandler(runSoon);
  setListChangeHandler(uploadListSoon);

  // Al volver la conexión
  const unsubscribeConnection = subscribeToConnection((online) => {
    setStatus({ online });
    if (online) runSoon();
  });

  // Al volver a la app desde otra
  const appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state === "active") runSoon();
  });

  // Mantiene al día los contadores de pendientes
  const refresh = () => {
    refreshStatus().catch(() => {});
  };

  const unsubscribeCatalog = subscribeLocal(
    LOCAL_KEYS.catalog,
    EMPTY.catalog,
    refresh,
  );
  const unsubscribeHistory = subscribeLocal(
    LOCAL_KEYS.history(userId),
    EMPTY.history,
    refresh,
  );
  const unsubscribeList = subscribeLocal(
    LOCAL_KEYS.list(userId),
    EMPTY.list,
    refresh,
  );

  return () => {
    clearTimeout(timer);
    clearTimeout(listTimer);
    setPendingChangeHandler(null);
    setHistoryChangeHandler(null);
    setListChangeHandler(null);
    unsubscribeConnection();
    appStateSubscription.remove();
    unsubscribeCatalog();
    unsubscribeHistory();
    unsubscribeList();
    activeUserId = null;
  };
}
