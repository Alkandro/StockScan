// import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
// import { db } from "../lib/firebase";
// import { EMPTY, LOCAL_KEYS, readLocal, updateLocal } from "./localStore";
// import { withTimeout } from "./network";

// const COUNTS = "counts";
// const BATCH_SIZE = 400;
// const REMOTE_TIMEOUT_MS = 15000;
// const MAX_PUSH_ROUNDS = 3;

// function key(userId) {
//   return LOCAL_KEYS.list(userId);
// }

// function offlineError() {
//   const err = new Error("offline");
//   err.code = "offline";
//   return err;
// }

// function timestampToMs(value) {
//   if (value && typeof value.toMillis === "function") return value.toMillis();
//   return typeof value === "number" ? value : 0;
// }

// async function fetchRemoteItems(userId) {
//   const snapshot = await withTimeout(
//     getDocs(collection(db, COUNTS, userId, "items")),
//     REMOTE_TIMEOUT_MS,
//   );

//   // Sin conexión Firestore puede devolver datos de su caché (vacíos): no se usan
//   if (snapshot.metadata.fromCache) throw offlineError();

//   return snapshot;
// }

// /** Baja la lista de Firebase al celular (solo si el celular no tiene cambios sin subir). */
// async function pullList(userId) {
//   const snapshot = await fetchRemoteItems(userId);
//   const remote = {};

//   snapshot.docs.forEach((item) => {
//     const data = item.data();
//     const quantity = Number(data.quantity || 0);

//     if (!Number.isInteger(quantity) || quantity < 1) return;

//     remote[item.id] = {
//       productNumber: data.productNumber || "",
//       quantity,
//       createdAtMs: timestampToMs(data.createdAt) || Date.now(),
//       updatedAtMs: timestampToMs(data.updatedAt) || Date.now(),
//     };
//   });

//   await updateLocal(key(userId), EMPTY.list, (draft) => {
//     // Si hay cambios locales sin subir, primero se suben
//     if (draft.dirty) return;

//     draft.items = remote;
//     draft.loaded = true;
//     draft.lastSyncMs = Date.now();
//   });
// }

// /**
//  * Sube la lista del celular a Firebase: crea o actualiza los renglones
//  * que cambiaron y borra los que ya no están en el celular.
//  * Devuelve true si el usuario cambió algo mientras se subía.
//  */
// async function pushList(userId) {
//   const local = await readLocal(key(userId), EMPTY.list);

//   const sent = {
//     rev: local.rev || 0,
//     items: local.items || {},
//   };

//   const remoteSnapshot = await fetchRemoteItems(userId);
//   const remoteById = new Map(
//     remoteSnapshot.docs.map((item) => [item.id, item.data()]),
//   );

//   const ops = [];

//   Object.entries(sent.items).forEach(([id, item]) => {
//     const current = remoteById.get(id);

//     // Si en Firebase ya está igual, no se vuelve a escribir
//     if (
//       current &&
//       Number(current.quantity) === item.quantity &&
//       current.productNumber === item.productNumber
//     ) {
//       return;
//     }

//     ops.push({
//       type: "set",
//       ref: doc(db, COUNTS, userId, "items", id),
//       data: {
//         productNumber: item.productNumber,
//         quantity: item.quantity,
//         countedBy: userId,
//         createdAt: new Date(item.createdAtMs || Date.now()),
//         updatedAt: new Date(item.updatedAtMs || Date.now()),
//       },
//     });
//   });

//   remoteSnapshot.docs.forEach((item) => {
//     if (!(item.id in sent.items)) {
//       ops.push({ type: "delete", ref: item.ref });
//     }
//   });

//   for (let i = 0; i < ops.length; i += BATCH_SIZE) {
//     const batch = writeBatch(db);

//     ops.slice(i, i + BATCH_SIZE).forEach((op) => {
//       if (op.type === "set") batch.set(op.ref, op.data);
//       else batch.delete(op.ref);
//     });

//     await withTimeout(batch.commit(), REMOTE_TIMEOUT_MS);
//   }

//   let changedMeanwhile = false;

//   await updateLocal(key(userId), EMPTY.list, (draft) => {
//     draft.loaded = true;

//     // Si el usuario cambió algo mientras se subía, queda pendiente
//     if ((draft.rev || 0) !== sent.rev) {
//       changedMeanwhile = true;
//       return;
//     }

//     draft.dirty = false;
//     draft.lastSyncMs = Date.now();
//   });

//   return changedMeanwhile;
// }

// /**
//  * Sincroniza la lista con Firebase: sube los cambios pendientes o,
//  * si no hay, baja lo que haya en Firebase.
//  * Requiere conexión. Lanza un error si no se pudo.
//  */
// export async function syncList(userId) {
//   if (!userId) return;

//   for (let round = 0; round < MAX_PUSH_ROUNDS; round += 1) {
//     const local = await readLocal(key(userId), EMPTY.list);

//     if (!local.dirty) {
//       await pullList(userId);
//       return;
//     }

//     const changedMeanwhile = await pushList(userId);
//     if (!changedMeanwhile) return;
//   }
// }

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { cleanPallets, getItemPallets } from "./countService";
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

function sumPallets(pallets) {
  return Object.values(pallets).reduce(
    (sum, quantity) => sum + Number(quantity || 0),
    0,
  );
}

// Texto comparable del detalle por palet, para saber si cambió
function palletsKey(pallets) {
  return Object.entries(pallets || {})
    .filter(([, quantity]) => Number(quantity) > 0)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([pallet, quantity]) => `${pallet}:${Number(quantity)}`)
    .join(",");
}

function sessionFromMeta(meta) {
  if (!meta || meta.sessionActive !== true) return null;

  const total = Number(meta.totalPallets);
  const current = Number(meta.currentPallet);

  if (!Number.isInteger(total) || total < 1) return null;

  return {
    totalPallets: total,
    currentPallet: Number.isInteger(current)
      ? Math.min(Math.max(current, 1), total)
      : 1,
    startedAtMs: timestampToMs(meta.startedAt) || Date.now(),
  };
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
  const metaSnap = await withTimeout(
    getDoc(doc(db, COUNTS, userId)),
    REMOTE_TIMEOUT_MS,
  );

  const remote = {};

  snapshot.docs.forEach((item) => {
    const data = item.data();
    const pallets = cleanPallets(data.pallets, Number(data.quantity));
    const quantity = sumPallets(pallets);

    if (quantity < 1) return;

    remote[item.id] = {
      productNumber: data.productNumber || "",
      quantity,
      pallets,
      createdAtMs: timestampToMs(data.createdAt) || Date.now(),
      updatedAtMs: timestampToMs(data.updatedAt) || Date.now(),
    };
  });

  const remoteSession = sessionFromMeta(
    metaSnap.exists() ? metaSnap.data() : null,
  );

  await updateLocal(key(userId), EMPTY.list, (draft) => {
    // Si hay cambios locales sin subir, primero se suben
    if (draft.dirty) return;

    draft.items = remote;
    draft.session = remoteSession;
    draft.loaded = true;
    draft.lastSyncMs = Date.now();
  });
}

/**
 * Sube la lista del celular a Firebase: crea o actualiza los renglones
 * que cambiaron, borra los que ya no están y guarda el palet en curso.
 * Devuelve true si el usuario cambió algo mientras se subía.
 */
async function pushList(userId) {
  const local = await readLocal(key(userId), EMPTY.list);

  const sent = {
    rev: local.rev || 0,
    items: local.items || {},
    session: local.session || null,
  };

  const remoteSnapshot = await fetchRemoteItems(userId);
  const metaRef = doc(db, COUNTS, userId);
  const metaSnap = await withTimeout(getDoc(metaRef), REMOTE_TIMEOUT_MS);
  const remoteMeta = metaSnap.exists() ? metaSnap.data() : null;

  const remoteById = new Map(
    remoteSnapshot.docs.map((item) => [item.id, item.data()]),
  );

  const ops = [];

  Object.entries(sent.items).forEach(([id, item]) => {
    const pallets = getItemPallets(item);
    const current = remoteById.get(id);

    // Si en Firebase ya está igual, no se vuelve a escribir
    if (
      current &&
      Number(current.quantity) === item.quantity &&
      current.productNumber === item.productNumber &&
      palletsKey(current.pallets) === palletsKey(pallets)
    ) {
      return;
    }

    ops.push({
      type: "set",
      ref: doc(db, COUNTS, userId, "items", id),
      data: {
        productNumber: item.productNumber,
        quantity: item.quantity,
        pallets: cleanPallets(pallets, item.quantity),
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

  // Palet en curso
  if (sent.session) {
    const same =
      remoteMeta &&
      remoteMeta.sessionActive === true &&
      Number(remoteMeta.totalPallets) === sent.session.totalPallets &&
      Number(remoteMeta.currentPallet) === sent.session.currentPallet;

    if (!same) {
      await withTimeout(
        setDoc(
          metaRef,
          {
            userId,
            status: "open",
            sessionActive: true,
            totalPallets: sent.session.totalPallets,
            currentPallet: sent.session.currentPallet,
            startedAt: new Date(sent.session.startedAtMs || Date.now()),
            updatedAt: new Date(),
          },
          { merge: true },
        ),
        REMOTE_TIMEOUT_MS,
      );
    }
  } else if (remoteMeta) {
    await withTimeout(deleteDoc(metaRef), REMOTE_TIMEOUT_MS);
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
