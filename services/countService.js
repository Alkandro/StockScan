// import i18n from "i18next";
// import { EMPTY, LOCAL_KEYS, subscribeLocal, updateLocal } from "./localStore";

// const MAX_QUANTITY = 100000;

// // La sincronización se registra acá para subir la lista unos segundos después
// let changeHandler = null;

// export function setListChangeHandler(handler) {
//   changeHandler = handler;
// }

// /** ID del documento de un producto a partir del código leído. */
// export function productIdFromQr(qrData) {
//   return encodeURIComponent(qrData.trim()).replace(/%/g, "_").slice(0, 140);
// }

// function listKey(userId) {
//   return LOCAL_KEYS.list(userId);
// }

// // Marca la lista como modificada: queda pendiente de subir a Firebase
// function markDirty(draft) {
//   draft.dirty = true;
//   draft.rev = (draft.rev || 0) + 1;
// }

// async function mutate(userId, mutator) {
//   const result = await updateLocal(listKey(userId), EMPTY.list, mutator);
//   changeHandler?.();
//   return result;
// }

// /** Escucha los renglones de la lista (guardada en el celular). */
// export function subscribeToCount(userId, onData, onError) {
//   try {
//     return subscribeLocal(listKey(userId), EMPTY.list, (list) => {
//       onData(
//         Object.entries(list.items || {}).map(([id, item]) => ({
//           id,
//           ...item,
//           createdAtMs: item.createdAtMs ?? null,
//         })),
//       );
//     });
//   } catch (error) {
//     onError?.(error);
//     return () => {};
//   }
// }

// /** Suma 1 al renglón de la lista (lo crea si no existe). Devuelve la cantidad. */
// export function addToLocalCount(userId, productId, productNumber) {
//   return mutate(userId, (draft) => {
//     const now = Date.now();
//     const item = draft.items[productId];

//     markDirty(draft);

//     if (item) {
//       item.quantity = Math.min(Number(item.quantity || 0) + 1, MAX_QUANTITY);
//       item.updatedAtMs = now;
//       return item.quantity;
//     }

//     draft.items[productId] = {
//       productNumber,
//       quantity: 1,
//       createdAtMs: now,
//       updatedAtMs: now,
//     };

//     return 1;
//   });
// }

// /** Resta 1. Si llega a 0, elimina el renglón. */
// export function decrementCountItem(userId, productId) {
//   return mutate(userId, (draft) => {
//     const item = draft.items[productId];
//     if (!item) return null;

//     markDirty(draft);

//     const next = Number(item.quantity || 0) - 1;

//     if (next <= 0) {
//       delete draft.items[productId];
//       return 0;
//     }

//     item.quantity = next;
//     item.updatedAtMs = Date.now();
//     return next;
//   });
// }

// /** Borra un renglón de la lista (nunca toca el catálogo de productos). */
// export async function removeCountItem(userId, productId) {
//   await mutate(userId, (draft) => {
//     if (draft.items[productId]) {
//       delete draft.items[productId];
//       markDirty(draft);
//     }
//   });
// }

// /**
//  * Vacía la lista.
//  * No toca el catálogo de productos ni el historial.
//  * En Firebase se vacía en la próxima sincronización.
//  */
// export function deleteCount(userId) {
//   return mutate(userId, (draft) => {
//     const count = Object.keys(draft.items).length;

//     draft.items = {};
//     markDirty(draft);

//     return count;
//   });
// }

// /**
//  * Restaura una lista del historial como lista actual.
//  * Solo si no hay una lista en curso:
//  * si ya hay renglones, lanza "list-not-empty".
//  * items: [{ productNumber, quantity }]
//  */
// export function restoreCount(userId, { items, startedAt }) {
//   return mutate(userId, (draft) => {
//     if (Object.keys(draft.items).length > 0) {
//       const err = new Error(i18n.t("countService.errors.listNotEmpty"));
//       err.code = "list-not-empty";
//       throw err;
//     }

//     const now = Date.now();
//     const createdAtMs = startedAt || now;

//     const valid = items.filter(
//       (item) =>
//         item.productNumber &&
//         Number.isInteger(item.quantity) &&
//         item.quantity >= 1,
//     );

//     valid.forEach((item) => {
//       draft.items[productIdFromQr(item.productNumber)] = {
//         productNumber: item.productNumber,
//         quantity: Math.min(item.quantity, MAX_QUANTITY),
//         createdAtMs,
//         updatedAtMs: now,
//       };
//     });

//     markDirty(draft);

//     return valid.length;
//   });
// }

import i18n from "i18next";
import { EMPTY, LOCAL_KEYS, subscribeLocal, updateLocal } from "./localStore";

const MAX_QUANTITY = 100000;
export const MAX_PALLETS = 99;

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

function sumPallets(pallets) {
  return Object.values(pallets).reduce(
    (sum, quantity) => sum + Number(quantity || 0),
    0,
  );
}

/** Deja solo palets y cantidades válidos. Si no queda ninguno, usa el palet 1. */
export function cleanPallets(raw, fallbackQuantity) {
  const result = {};

  if (raw && typeof raw === "object") {
    Object.entries(raw).forEach(([pallet, quantity]) => {
      const n = Number(pallet);
      const q = Number(quantity);

      if (Number.isInteger(n) && n >= 1 && Number.isInteger(q) && q >= 1) {
        result[String(n)] = q;
      }
    });
  }

  if (
    Object.keys(result).length === 0 &&
    Number.isInteger(fallbackQuantity) &&
    fallbackQuantity >= 1
  ) {
    result["1"] = fallbackQuantity;
  }

  return result;
}

/** Palets de un renglón: { "1": 3, "3": 1 }. Un renglón viejo, sin palets, cuenta como palet 1. */
export function getItemPallets(item) {
  if (item?.pallets && Object.keys(item.pallets).length > 0) {
    return item.pallets;
  }

  const quantity = Number(item?.quantity || 0);
  return quantity > 0 ? { 1: quantity } : {};
}

/** { "1": 3, "3": 1 } -> [{ pallet: 1, quantity: 3 }, { pallet: 3, quantity: 1 }] */
export function entriesFromPallets(pallets) {
  return Object.entries(pallets || {})
    .map(([pallet, quantity]) => ({
      pallet: Number(pallet),
      quantity: Number(quantity),
    }))
    .filter((entry) => Number.isInteger(entry.pallet) && entry.quantity > 0)
    .sort((a, b) => a.pallet - b.pallet);
}

export function palletEntries(item) {
  return entriesFromPallets(getItemPallets(item));
}

/** "P1: 3 · P3: 1" */
export function formatPalletBreakdown(entries, t) {
  return entries
    .map(
      (entry) =>
        `${t("pallets.short", { n: entry.pallet })}: ${entry.quantity}`,
    )
    .join(" · ");
}

/** Escucha la lista guardada en el celular: renglones y palet en curso. */
export function subscribeToList(userId, onData, onError) {
  try {
    return subscribeLocal(listKey(userId), EMPTY.list, (list) => {
      onData({
        items: Object.entries(list.items || {}).map(([id, item]) => ({
          id,
          ...item,
          pallets: getItemPallets(item),
          createdAtMs: item.createdAtMs ?? null,
        })),
        session: list.session || null,
      });
    });
  } catch (error) {
    onError?.(error);
    return () => {};
  }
}

/**
 * Suma 1 al renglón de la lista, dentro del palet en curso.
 * Devuelve { quantity (total), pallet (en curso), pallets (detalle) }.
 * Si no se empezó la lista por palets, lanza "no-pallet-session".
 */
export function addToLocalCount(userId, productId, productNumber) {
  return mutate(userId, (draft) => {
    const session = draft.session;

    if (!session) {
      const err = new Error(i18n.t("pallets.noSession"));
      err.code = "no-pallet-session";
      throw err;
    }

    const now = Date.now();
    const pallet = String(session.currentPallet);
    let item = draft.items[productId];

    if (!item) {
      item = {
        productNumber,
        quantity: 0,
        pallets: {},
        createdAtMs: now,
        updatedAtMs: now,
      };
      draft.items[productId] = item;
    } else if (!item.pallets) {
      // Renglón viejo: sus lecturas cuentan como palet 1
      item.pallets = getItemPallets(item);
    }

    item.pallets[pallet] = Math.min(
      Number(item.pallets[pallet] || 0) + 1,
      MAX_QUANTITY,
    );
    item.quantity = Math.min(sumPallets(item.pallets), MAX_QUANTITY);
    item.updatedAtMs = now;
    markDirty(draft);

    return {
      quantity: item.quantity,
      pallet: session.currentPallet,
      pallets: { ...item.pallets },
    };
  });
}

/**
 * Resta 1. Se resta del palet en curso; si ahí no hay, del último palet que tenga.
 * Si el total llega a 0, elimina el renglón.
 */
export function decrementCountItem(userId, productId) {
  return mutate(userId, (draft) => {
    const item = draft.items[productId];
    if (!item) return null;

    if (!item.pallets) item.pallets = getItemPallets(item);

    const current = draft.session ? String(draft.session.currentPallet) : null;
    let target = null;

    if (current && Number(item.pallets[current] || 0) > 0) {
      target = current;
    } else {
      const withStock = Object.keys(item.pallets)
        .filter((pallet) => Number(item.pallets[pallet]) > 0)
        .map(Number)
        .sort((a, b) => b - a);

      if (withStock.length > 0) target = String(withStock[0]);
    }

    markDirty(draft);

    if (target === null) {
      delete draft.items[productId];
      return 0;
    }

    item.pallets[target] = Number(item.pallets[target]) - 1;
    if (item.pallets[target] <= 0) delete item.pallets[target];

    const total = sumPallets(item.pallets);

    if (total <= 0) {
      delete draft.items[productId];
      return 0;
    }

    item.quantity = total;
    item.updatedAtMs = Date.now();
    return total;
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
 * Vacía la lista y cierra el conteo por palets.
 * No toca el catálogo de productos ni el historial.
 * En Firebase se vacía en la próxima sincronización.
 */
export function deleteCount(userId) {
  return mutate(userId, (draft) => {
    const count = Object.keys(draft.items).length;

    draft.items = {};
    draft.session = null;
    markDirty(draft);

    return count;
  });
}

/**
 * Empieza el conteo por palets: queda en el palet 1.
 * Si ya hay una lista en curso, lanza "list-not-empty".
 */
export function startSession(userId, totalPallets) {
  return mutate(userId, (draft) => {
    const total = Number.parseInt(totalPallets, 10);

    if (!Number.isInteger(total) || total < 1 || total > MAX_PALLETS) {
      const err = new Error(
        i18n.t("pallets.modalInvalid", { max: MAX_PALLETS }),
      );
      err.code = "invalid-pallets";
      throw err;
    }

    if (draft.session || Object.keys(draft.items).length > 0) {
      const err = new Error(i18n.t("pallets.listInProgressMessage"));
      err.code = "list-not-empty";
      throw err;
    }

    draft.session = {
      totalPallets: total,
      currentPallet: 1,
      startedAtMs: Date.now(),
    };
    markDirty(draft);

    return draft.session;
  });
}

/** Cambia de palet (delta = +1 siguiente, -1 anterior). Devuelve el palet en curso. */
export function movePallet(userId, delta) {
  return mutate(userId, (draft) => {
    if (!draft.session) return null;

    const next = draft.session.currentPallet + delta;

    if (next < 1 || next > draft.session.totalPallets) {
      return draft.session.currentPallet;
    }

    draft.session.currentPallet = next;
    markDirty(draft);

    return next;
  });
}

/**
 * Restaura una lista del historial como lista actual, con sus palets.
 * Solo si no hay una lista en curso: si ya la hay, lanza "list-not-empty".
 * items: [{ productNumber, quantity, pallets }]
 */
export function restoreCount(userId, { items, startedAt, palletCount }) {
  return mutate(userId, (draft) => {
    if (draft.session || Object.keys(draft.items).length > 0) {
      const err = new Error(i18n.t("countService.errors.listNotEmpty"));
      err.code = "list-not-empty";
      throw err;
    }

    const now = Date.now();
    const createdAtMs = startedAt || now;
    let highestPallet = 1;
    let restored = 0;

    items.forEach((item) => {
      if (!item.productNumber) return;

      const pallets = cleanPallets(item.pallets, Number(item.quantity));
      const quantity = sumPallets(pallets);

      if (quantity < 1) return;

      Object.keys(pallets).forEach((pallet) => {
        highestPallet = Math.max(highestPallet, Number(pallet));
      });

      draft.items[productIdFromQr(item.productNumber)] = {
        productNumber: item.productNumber,
        quantity: Math.min(quantity, MAX_QUANTITY),
        pallets,
        createdAtMs,
        updatedAtMs: now,
      };

      restored += 1;
    });

    const total = Math.min(
      MAX_PALLETS,
      Math.max(Number(palletCount) || 0, highestPallet, 1),
    );

    draft.session = {
      totalPallets: total,
      currentPallet: total,
      startedAtMs: createdAtMs,
    };
    markDirty(draft);

    return restored;
  });
}
