import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { EMPTY, LOCAL_KEYS, readLocal, updateLocal } from "./localStore";
import { withTimeout } from "./network";

const COUNTS = "counts";
const BATCH_SIZE = 400;
const REMOTE_TIMEOUT_MS = 15000;
const MAX_PUSH_ROUNDS = 3;

function key(userId) {
  return LOCAL_KEYS.list(userId);
}

function offlineError() {
  const err = new Error("offline");
  err.code = "offline";
  return err;
}

function timestampToMs(value) {
  if (value && typeof value.toMillis === "function") return value.toMillis();
  return typeof value === "number" ? value : 0;
}

async function fetchRemoteItems(userId) {
  const snapshot = await withTimeout(
    getDocs(collection(db, COUNTS, userId, "items")),
    REMOTE_TIMEOUT_MS,
  );

  // Sin conexión Firestore puede devolver datos de su caché (vacíos): no se usan
  if (snapshot.metadata.fromCache) throw offlineError();

  return snapshot;
}

/** Baja la lista de Firebase al celular (solo si el celular no tiene cambios sin subir). */
async function pullList(userId) {
  const snapshot = await fetchRemoteItems(userId);
  const remote = {};

  snapshot.docs.forEach((item) => {
    const data = item.data();
    const quantity = Number(data.quantity || 0);

    if (!Number.isInteger(quantity) || quantity < 1) return;

    remote[item.id] = {
      productNumber: data.productNumber || "",
      quantity,
      createdAtMs: timestampToMs(data.createdAt) || Date.now(),
      updatedAtMs: timestampToMs(data.updatedAt) || Date.now(),
    };
  });

  await updateLocal(key(userId), EMPTY.list, (draft) => {
    // Si hay cambios locales sin subir, primero se suben
    if (draft.dirty) return;

    draft.items = remote;
    draft.loaded = true;
    draft.lastSyncMs = Date.now();
  });
}

/**
 * Sube la lista del celular a Firebase: crea o actualiza los renglones
 * que cambiaron y borra los que ya no están en el celular.
 * Devuelve true si el usuario cambió algo mientras se subía.
 */
async function pushList(userId) {
  const local = await readLocal(key(userId), EMPTY.list);

  const sent = {
    rev: local.rev || 0,
    items: local.items || {},
  };

  const remoteSnapshot = await fetchRemoteItems(userId);
  const remoteById = new Map(
    remoteSnapshot.docs.map((item) => [item.id, item.data()]),
  );

  const ops = [];

  Object.entries(sent.items).forEach(([id, item]) => {
    const current = remoteById.get(id);

    // Si en Firebase ya está igual, no se vuelve a escribir
    if (
      current &&
      Number(current.quantity) === item.quantity &&
      current.productNumber === item.productNumber
    ) {
      return;
    }

    ops.push({
      type: "set",
      ref: doc(db, COUNTS, userId, "items", id),
      data: {
        productNumber: item.productNumber,
        quantity: item.quantity,
        countedBy: userId,
        createdAt: new Date(item.createdAtMs || Date.now()),
        updatedAt: new Date(item.updatedAtMs || Date.now()),
      },
    });
  });

  remoteSnapshot.docs.forEach((item) => {
    if (!(item.id in sent.items)) {
      ops.push({ type: "delete", ref: item.ref });
    }
  });

  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);

    ops.slice(i, i + BATCH_SIZE).forEach((op) => {
      if (op.type === "set") batch.set(op.ref, op.data);
      else batch.delete(op.ref);
    });

    await withTimeout(batch.commit(), REMOTE_TIMEOUT_MS);
  }

  let changedMeanwhile = false;

  await updateLocal(key(userId), EMPTY.list, (draft) => {
    draft.loaded = true;

    // Si el usuario cambió algo mientras se subía, queda pendiente
    if ((draft.rev || 0) !== sent.rev) {
      changedMeanwhile = true;
      return;
    }

    draft.dirty = false;
    draft.lastSyncMs = Date.now();
  });

  return changedMeanwhile;
}

/**
 * Sincroniza la lista con Firebase: sube los cambios pendientes o,
 * si no hay, baja lo que haya en Firebase.
 * Requiere conexión. Lanza un error si no se pudo.
 */
export async function syncList(userId) {
  if (!userId) return;

  for (let round = 0; round < MAX_PUSH_ROUNDS; round += 1) {
    const local = await readLocal(key(userId), EMPTY.list);

    if (!local.dirty) {
      await pullList(userId);
      return;
    }

    const changedMeanwhile = await pushList(userId);
    if (!changedMeanwhile) return;
  }
}
