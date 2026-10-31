import { doc, getDoc, runTransaction } from "firebase/firestore";
import i18n from "i18next";
import { db } from "../lib/firebase";
import { cleanPallets } from "./countService";
import { EMPTY, LOCAL_KEYS, readLocal, updateLocal } from "./localStore";
import { withTimeout } from "./network";

const HISTORY = "userHistory";
const MAX_RECORDS = 120;
const REMOTE_TIMEOUT_MS = 15000;
const FIRST_LOAD_TIMEOUT_MS = 8000;
const MAX_PUSH_ROUNDS = 3;

// La sincronización se registra acá para subir los cambios apenas se pueda
let changeHandler = null;

export function setHistoryChangeHandler(handler) {
  changeHandler = handler;
}

function key(userId) {
  return LOCAL_KEYS.history(userId);
}

function byClosedAsc(a, b) {
  return (a.closedAt || 0) - (b.closedAt || 0);
}

function offlineError() {
  const err = new Error("offline");
  err.code = "offline";
  return err;
}

// ---------------------------------------------------------------------------
// Operaciones del usuario (siempre contra el celular, funcionan sin conexión)
// ---------------------------------------------------------------------------

/**
 * Guarda (o reemplaza, si ya existe el mismo recordId)
 * una lista en el historial.
 * items: [{ productNumber, description, quantity, pallets }]
 */
export async function saveListRecord(
  userId,
  { recordId, startedAt, closedAt, items, palletCount },
) {
  if (!userId) {
    throw new Error(i18n.t("historyService.errors.noSession"));
  }

  const compact = items.map((item) => {
    const quantity = Number(item.quantity || 0);

    return {
      c: String(item.productNumber || ""),
      d: String(item.description || ""),
      q: quantity,
      p: cleanPallets(item.pallets, quantity),
    };
  });

  const record = {
    id: recordId,
    startedAt: startedAt ?? null,
    closedAt,
    palletCount: palletCount ?? null,
    totalProducts: compact.length,
    totalUnits: compact.reduce((sum, item) => sum + item.q, 0),
    items: compact,
  };

  await updateLocal(key(userId), EMPTY.history, (draft) => {
    draft.records = [...draft.records.filter((r) => r.id !== recordId), record]
      .sort(byClosedAsc)
      .slice(-MAX_RECORDS);
    draft.deletedIds = draft.deletedIds.filter((id) => id !== recordId);
    draft.dirty = true;
    draft.rev = (draft.rev || 0) + 1;
  });

  changeHandler?.();

  return recordId;
}

/** Quita una lista del historial
 * (se usa al reabrirla).
 */
export async function removeListRecord(userId, recordId) {
  await updateLocal(key(userId), EMPTY.history, (draft) => {
    draft.records = draft.records.filter((r) => r.id !== recordId);

    if (!draft.deletedIds.includes(recordId)) {
      draft.deletedIds.push(recordId);
    }

    draft.dirty = true;
    draft.rev = (draft.rev || 0) + 1;
  });

  changeHandler?.();
}

/** Tilda o destilda una pieza de una lista del historial ("ya la cargué"). */
export async function setRecordItemChecked(userId, recordId, code, checked) {
  await updateLocal(key(userId), EMPTY.history, (draft) => {
    const record = draft.records.find((r) => r.id === recordId);
    const item = (record?.items || []).find((entry) => entry.c === code);

    if (!item) return;

    if (checked) item.x = 1;
    else delete item.x;

    draft.dirty = true;
    draft.rev = (draft.rev || 0) + 1;
  });

  changeHandler?.();
}

/** Listas guardadas, de la más nueva a la más vieja. */
export async function getHistoryRecords(userId) {
  let local = await readLocal(key(userId), EMPTY.history);

  // Primera vez en este celular: si hay conexión, se baja el historial
  if (!local.loaded && !local.dirty) {
    try {
      await withTimeout(pullHistory(userId), FIRST_LOAD_TIMEOUT_MS);
      local = await readLocal(key(userId), EMPTY.history);
    } catch (error) {
      // Sin conexión: se muestra lo que haya en el celular
    }
  }

  return [...local.records].sort(
    (a, b) => (b.closedAt || 0) - (a.closedAt || 0),
  );
}

/** Borra todo el historial del usuario
 * (solo si él lo pide).
 */
export async function clearHistory(userId) {
  await updateLocal(key(userId), EMPTY.history, (draft) => {
    draft.records = [];
    draft.deletedIds = [];
    draft.cleared = true;
    draft.dirty = true;
    draft.rev = (draft.rev || 0) + 1;
  });

  changeHandler?.();
}

// ---------------------------------------------------------------------------
// Sincronización con Firebase
// ---------------------------------------------------------------------------

async function pullHistory(userId) {
  const snap = await withTimeout(
    getDoc(doc(db, HISTORY, userId)),
    REMOTE_TIMEOUT_MS,
  );

  // Sin conexión Firestore puede devolver datos de su caché: no se usan
  if (snap.metadata.fromCache) throw offlineError();

  const remote =
    snap.exists() && Array.isArray(snap.data().records)
      ? snap.data().records
      : [];

  await updateLocal(key(userId), EMPTY.history, (draft) => {
    // Si hay cambios locales sin subir, primero se suben
    if (draft.dirty) return;

    draft.records = remote;
    draft.loaded = true;
    draft.lastSyncMs = Date.now();
  });
}

/**
 * Sube los cambios del celular a Firebase combinándolos con lo que ya hay.
 * Devuelve true si el usuario cambió algo mientras se subía.
 */
async function pushHistory(userId) {
  const local = await readLocal(key(userId), EMPTY.history);

  const sent = {
    rev: local.rev || 0,
    records: local.records,
    deletedIds: local.deletedIds,
    cleared: local.cleared,
  };

  const ref = doc(db, HISTORY, userId);

  const merged = await withTimeout(
    runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);

      const remote =
        snap.exists() && Array.isArray(snap.data().records)
          ? snap.data().records
          : [];

      // Lo borrado en el celular se quita; lo guardado en el celular manda
      const base = sent.cleared
        ? []
        : remote.filter((r) => !sent.deletedIds.includes(r.id));

      const byId = new Map(base.map((r) => [r.id, r]));
      sent.records.forEach((r) => byId.set(r.id, r));

      const records = [...byId.values()].sort(byClosedAsc).slice(-MAX_RECORDS);

      if (records.length === 0) {
        transaction.delete(ref);
      } else {
        transaction.set(ref, {
          userId,
          updatedAt: new Date(),
          records,
        });
      }

      return records;
    }),
    REMOTE_TIMEOUT_MS,
  );

  let changedMeanwhile = false;

  await updateLocal(key(userId), EMPTY.history, (draft) => {
    draft.loaded = true;

    // Si el usuario cambió algo mientras se subía, queda pendiente
    if ((draft.rev || 0) !== sent.rev) {
      changedMeanwhile = true;
      return;
    }

    draft.records = merged;
    draft.deletedIds = [];
    draft.cleared = false;
    draft.dirty = false;
    draft.lastSyncMs = Date.now();
  });

  return changedMeanwhile;
}

/**
 * Sincroniza el historial con Firebase:
 * sube los cambios pendientes o, si no hay, baja lo que haya en Firebase.
 * Requiere conexión. Lanza un error si no se pudo.
 */
export async function syncHistory(userId) {
  if (!userId) return;

  for (let round = 0; round < MAX_PUSH_ROUNDS; round += 1) {
    const local = await readLocal(key(userId), EMPTY.history);

    if (!local.dirty) {
      await pullHistory(userId);
      return;
    }

    const changedMeanwhile = await pushHistory(userId);
    if (!changedMeanwhile) return;
  }
}
