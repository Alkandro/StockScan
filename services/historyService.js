// import { deleteDoc, doc, getDoc, runTransaction } from "firebase/firestore";
// import { db } from "../lib/firebase";

// const HISTORY = "userHistory";
// const MAX_RECORDS = 120;

// /**
//  * Guarda (o reemplaza, si ya existe el mismo recordId) una lista en el historial.
//  * items: [{ productNumber, description, quantity }]
//  */
// export async function saveListRecord(
//   userId,
//   { recordId, startedAt, closedAt, items },
// ) {
//   if (!userId) throw new Error("No hay una sesión activa.");

//   const ref = doc(db, HISTORY, userId);

//   const compact = items.map((item) => ({
//     c: String(item.productNumber || ""),
//     d: String(item.description || ""),
//     q: Number(item.quantity || 0),
//   }));

//   const record = {
//     id: recordId,
//     startedAt: startedAt ?? null,
//     closedAt,
//     totalProducts: compact.length,
//     totalUnits: compact.reduce((sum, item) => sum + item.q, 0),
//     items: compact,
//   };

//   await runTransaction(db, async (transaction) => {
//     const snap = await transaction.get(ref);
//     const previous =
//       snap.exists() && Array.isArray(snap.data().records)
//         ? snap.data().records
//         : [];

//     const records = [...previous.filter((r) => r.id !== recordId), record]
//       .sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0))
//       .slice(-MAX_RECORDS);

//     transaction.set(ref, { userId, updatedAt: new Date(), records });
//   });

//   return recordId;
// }

// /** Quita una lista del historial (se usa al reabrirla). */
// export async function removeListRecord(userId, recordId) {
//   const ref = doc(db, HISTORY, userId);

//   await runTransaction(db, async (transaction) => {
//     const snap = await transaction.get(ref);
//     if (!snap.exists()) return;

//     const previous = Array.isArray(snap.data().records)
//       ? snap.data().records
//       : [];

//     transaction.set(ref, {
//       userId,
//       updatedAt: new Date(),
//       records: previous.filter((r) => r.id !== recordId),
//     });
//   });
// }

// /** Listas guardadas, de la más nueva a la más vieja. */
// export async function getHistoryRecords(userId) {
//   const snap = await getDoc(doc(db, HISTORY, userId));
//   if (!snap.exists()) return [];

//   const records = Array.isArray(snap.data().records) ? snap.data().records : [];
//   return [...records].sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
// }

// /** Borra todo el historial del usuario (solo si él lo pide). */
// export async function clearHistory(userId) {
//   await deleteDoc(doc(db, HISTORY, userId));
// }

import { deleteDoc, doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";
import i18n from "i18next";

const HISTORY = "userHistory";
const MAX_RECORDS = 120;

/**
 * Guarda (o reemplaza, si ya existe el mismo recordId)
 * una lista en el historial.
 * items: [{ productNumber, description, quantity }]
 */
export async function saveListRecord(
  userId,
  { recordId, startedAt, closedAt, items },
) {
  if (!userId) {
    throw new Error(i18n.t("historyService.errors.noSession"));
  }

  const ref = doc(db, HISTORY, userId);

  const compact = items.map((item) => ({
    c: String(item.productNumber || ""),
    d: String(item.description || ""),
    q: Number(item.quantity || 0),
  }));

  const record = {
    id: recordId,
    startedAt: startedAt ?? null,
    closedAt,
    totalProducts: compact.length,
    totalUnits: compact.reduce((sum, item) => sum + item.q, 0),
    items: compact,
  };

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);

    const previous =
      snap.exists() && Array.isArray(snap.data().records)
        ? snap.data().records
        : [];

    const records = [...previous.filter((r) => r.id !== recordId), record]
      .sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0))
      .slice(-MAX_RECORDS);

    transaction.set(ref, {
      userId,
      updatedAt: new Date(),
      records,
    });
  });

  return recordId;
}

/** Quita una lista del historial
 * (se usa al reabrirla).
 */
export async function removeListRecord(userId, recordId) {
  const ref = doc(db, HISTORY, userId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);

    if (!snap.exists()) return;

    const previous = Array.isArray(snap.data().records)
      ? snap.data().records
      : [];

    transaction.set(ref, {
      userId,
      updatedAt: new Date(),
      records: previous.filter((r) => r.id !== recordId),
    });
  });
}

/** Listas guardadas, de la más nueva a la más vieja. */
export async function getHistoryRecords(userId) {
  const snap = await getDoc(doc(db, HISTORY, userId));

  if (!snap.exists()) return [];

  const records = Array.isArray(snap.data().records) ? snap.data().records : [];

  return [...records].sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
}

/** Borra todo el historial del usuario
 * (solo si él lo pide).
 */
export async function clearHistory(userId) {
  await deleteDoc(doc(db, HISTORY, userId));
}
