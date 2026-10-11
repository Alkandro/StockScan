import i18n from "i18next";
import { EMPTY, LOCAL_KEYS, subscribeLocal, updateLocal } from "./localStore";

const MAX_QUANTITY = 100000;

// La sincronización se registra acá para subir la lista unos segundos después
let changeHandler = null;

export function setListChangeHandler(handler) {
  changeHandler = handler;
}

/** ID del documento de un producto a partir del código leído. */
export function productIdFromQr(qrData) {
  return encodeURIComponent(qrData.trim()).replace(/%/g, "_").slice(0, 140);
}

function listKey(userId) {
  return LOCAL_KEYS.list(userId);
}

// Marca la lista como modificada: queda pendiente de subir a Firebase
function markDirty(draft) {
  draft.dirty = true;
  draft.rev = (draft.rev || 0) + 1;
}

async function mutate(userId, mutator) {
  const result = await updateLocal(listKey(userId), EMPTY.list, mutator);
  changeHandler?.();
  return result;
}

/** Escucha los renglones de la lista (guardada en el celular). */
export function subscribeToCount(userId, onData, onError) {
  try {
    return subscribeLocal(listKey(userId), EMPTY.list, (list) => {
      onData(
        Object.entries(list.items || {}).map(([id, item]) => ({
          id,
          ...item,
          createdAtMs: item.createdAtMs ?? null,
        })),
      );
    });
  } catch (error) {
    onError?.(error);
    return () => {};
  }
}

/** Suma 1 al renglón de la lista (lo crea si no existe). Devuelve la cantidad. */
export function addToLocalCount(userId, productId, productNumber) {
  return mutate(userId, (draft) => {
    const now = Date.now();
    const item = draft.items[productId];

    markDirty(draft);

    if (item) {
      item.quantity = Math.min(Number(item.quantity || 0) + 1, MAX_QUANTITY);
      item.updatedAtMs = now;
      return item.quantity;
    }

    draft.items[productId] = {
      productNumber,
      quantity: 1,
      createdAtMs: now,
      updatedAtMs: now,
    };

    return 1;
  });
}

/** Resta 1. Si llega a 0, elimina el renglón. */
export function decrementCountItem(userId, productId) {
  return mutate(userId, (draft) => {
    const item = draft.items[productId];
    if (!item) return null;

    markDirty(draft);

    const next = Number(item.quantity || 0) - 1;

    if (next <= 0) {
      delete draft.items[productId];
      return 0;
    }

    item.quantity = next;
    item.updatedAtMs = Date.now();
    return next;
  });
}

/** Borra un renglón de la lista (nunca toca el catálogo de productos). */
export async function removeCountItem(userId, productId) {
  await mutate(userId, (draft) => {
    if (draft.items[productId]) {
      delete draft.items[productId];
      markDirty(draft);
    }
  });
}

/**
 * Vacía la lista.
 * No toca el catálogo de productos ni el historial.
 * En Firebase se vacía en la próxima sincronización.
 */
export function deleteCount(userId) {
  return mutate(userId, (draft) => {
    const count = Object.keys(draft.items).length;

    draft.items = {};
    markDirty(draft);

    return count;
  });
}

/**
 * Restaura una lista del historial como lista actual.
 * Solo si no hay una lista en curso:
 * si ya hay renglones, lanza "list-not-empty".
 * items: [{ productNumber, quantity }]
 */
export function restoreCount(userId, { items, startedAt }) {
  return mutate(userId, (draft) => {
    if (Object.keys(draft.items).length > 0) {
      const err = new Error(i18n.t("countService.errors.listNotEmpty"));
      err.code = "list-not-empty";
      throw err;
    }

    const now = Date.now();
    const createdAtMs = startedAt || now;

    const valid = items.filter(
      (item) =>
        item.productNumber &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1,
    );

    valid.forEach((item) => {
      draft.items[productIdFromQr(item.productNumber)] = {
        productNumber: item.productNumber,
        quantity: Math.min(item.quantity, MAX_QUANTITY),
        createdAtMs,
        updatedAtMs: now,
      };
    });

    markDirty(draft);

    return valid.length;
  });
}
