import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const COUNTS = "counts";
const BATCH_SIZE = 400;

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

/** Escucha el estado de la lista: { status: "open" | "finalized", recordId }. */
export function subscribeToCountMeta(userId, onData, onError) {
  return onSnapshot(
    countRef(userId),
    (snap) => {
      const data = snap.exists() ? snap.data() : {};
      onData({
        status: data.status || "open",
        recordId: data.recordId || null,
      });
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

export async function finalizeCount(userId, { recordId, totals }) {
  await setDoc(
    countRef(userId),
    {
      userId,
      status: "finalized",
      finalizedAt: new Date(),
      recordId,
      totalProducts: totals.products,
      totalUnits: totals.units,
    },
    { merge: true },
  );
}

export async function reopenCount(userId) {
  await setDoc(
    countRef(userId),
    { userId, status: "open", reopenedAt: new Date() },
    { merge: true },
  );
}

/**
 * Elimina de Firebase la lista (renglones + documento de estado).
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
