import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const COUNTS = "counts";
const BATCH_SIZE = 400;

/** ID del documento de un producto a partir del código leído. */
export function productIdFromQr(qrData) {
  return encodeURIComponent(qrData.trim()).replace(/%/g, "_").slice(0, 140);
}

// La lista de cada usuario es un único documento: counts/{uid}
export function countRef(userId) {
  return doc(db, COUNTS, userId);
}

export function countItemRef(userId, productId) {
  return doc(db, COUNTS, userId, "items", productId);
}

/** Escucha en tiempo real los renglones de la lista. */
export function subscribeToCount(userId, onData, onError) {
  const itemsRef = collection(db, COUNTS, userId, "items");

  return onSnapshot(
    itemsRef,
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            ...data,
            createdAtMs:
              typeof data.createdAt?.toMillis === "function"
                ? data.createdAt.toMillis()
                : null,
          };
        }),
      );
    },
    onError,
  );
}

/** Resta 1. Si llega a 0, elimina el renglón. */
export async function decrementCountItem(userId, productId) {
  const ref = countItemRef(userId, productId);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return null;

    const next = Number(snap.data().quantity || 0) - 1;

    if (next <= 0) {
      transaction.delete(ref);
      return 0;
    }

    transaction.update(ref, { quantity: next, updatedAt: new Date() });
    return next;
  });
}

/** Borra un renglón de la lista (nunca toca el catálogo de productos). */
export async function removeCountItem(userId, productId) {
  await deleteDoc(countItemRef(userId, productId));
}

/**
 * Elimina de Firebase la lista (renglones + documento de estado, si existe).
 * No toca la colección "products" ni el historial.
 */
export async function deleteCount(userId) {
  const itemsRef = collection(db, COUNTS, userId, "items");
  const snapshot = await getDocs(itemsRef);
  const refs = snapshot.docs.map((item) => item.ref);

  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  await deleteDoc(countRef(userId));
  return refs.length;
}

/**
 * Restaura una lista del historial como lista actual.
 * Solo si no hay una lista en curso: si ya hay renglones, lanza "list-not-empty".
 * items: [{ productNumber, quantity }]
 */
export async function restoreCount(userId, { items, startedAt }) {
  const itemsRef = collection(db, COUNTS, userId, "items");

  const existing = await getDocs(query(itemsRef, limit(1)));
  if (!existing.empty) {
    const err = new Error("Ya hay una lista en curso.");
    err.code = "list-not-empty";
    throw err;
  }

  const now = new Date();
  const createdAt = startedAt ? new Date(startedAt) : now;

  const valid = items.filter(
    (item) =>
      item.productNumber &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 1,
  );

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    valid.slice(i, i + BATCH_SIZE).forEach((item) => {
      batch.set(countItemRef(userId, productIdFromQr(item.productNumber)), {
        productNumber: item.productNumber,
        quantity: item.quantity,
        countedBy: userId,
        createdAt,
        updatedAt: now,
      });
    });
    await batch.commit();
  }

  // Limpia un estado "finalizada" viejo, si había quedado
  try {
    await deleteDoc(countRef(userId));
  } catch (error) {
    console.warn("No se pudo limpiar el estado anterior de la lista:", error);
  }

  return valid.length;
}
