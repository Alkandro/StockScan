// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   runTransaction,
//   updateDoc,
// } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import i18n from "i18next";
// import { db } from "../lib/firebase";
// import { addToLocalCount, productIdFromQr } from "./countService";
// import { EMPTY, LOCAL_KEYS, readLocal, updateLocal } from "./localStore";
// import { isOnline, withTimeout } from "./network";

// const PRODUCTS = "products";
// const REMOTE_TIMEOUT_MS = 15000;

// // Debe coincidir con el email de la función isAdmin() en las reglas de Firestore
// export const ADMIN_EMAIL = "ale@a.com";

// // La sincronización se registra acá para subir los cambios apenas se pueda
// let pendingChangeHandler = null;

// export function setPendingChangeHandler(handler) {
//   pendingChangeHandler = handler;
// }

// function timestampToMs(value) {
//   if (value && typeof value.toMillis === "function") return value.toMillis();
//   return typeof value === "number" ? value : 0;
// }

// function toLocalProduct(id, data) {
//   return {
//     id,
//     productNumber: data.productNumber || "",
//     name: data.name || "",
//     status: data.status || "registered",
//     updatedAtMs: timestampToMs(data.updatedAt),
//   };
// }

// function offlineMessage() {
//   return i18n.t("productService.errors.offline", {
//     defaultValue: "Necesitás conexión para modificar productos.",
//   });
// }

// function readCatalog() {
//   return readLocal(LOCAL_KEYS.catalog, EMPTY.catalog);
// }

// /**
//  * true si la sesión actual es la del administrador (ADMIN_EMAIL).
//  * No lee Firestore. Se mantiene async para no cambiar a quienes la llaman.
//  */
// export async function isAdminUser() {
//   const email = getAuth().currentUser?.email;
//   return (
//     typeof email === "string" && email.trim().toLowerCase() === ADMIN_EMAIL
//   );
// }

// /** Busca primero en el catálogo del celular; si no está y hay conexión, en Firebase. */
// export async function getProductById(productId) {
//   const catalog = await readCatalog();
//   const local = catalog.products[productId];
//   if (local) return { ...local };

//   if (!(await isOnline())) return null;

//   try {
//     const snap = await withTimeout(getDoc(doc(db, PRODUCTS, productId)), 5000);
//     if (!snap.exists()) return null;
//     return toLocalProduct(snap.id, snap.data());
//   } catch (error) {
//     console.warn(i18n.t("productService.errors.loadConsole"), error);
//     return null;
//   }
// }

// // ---------------------------------------------------------------------------
// // Sincronización con Firebase
// // ---------------------------------------------------------------------------

// let pullInFlight = null;

// /**
//  * Baja el catálogo completo de Firebase al celular.
//  * Los productos registrados en el celular que todavía no se subieron se conservan.
//  */
// export function pullCatalog() {
//   if (!pullInFlight) {
//     pullInFlight = (async () => {
//       const snapshot = await getDocs(collection(db, PRODUCTS));

//       // Sin conexión Firestore puede devolver datos de su caché (vacíos):
//       // no se usan, para no borrar el catálogo guardado.
//       if (snapshot.metadata.fromCache) {
//         const err = new Error("offline");
//         err.code = "offline";
//         throw err;
//       }

//       const remote = {};
//       snapshot.docs.forEach((item) => {
//         remote[item.id] = toLocalProduct(item.id, item.data());
//       });

//       await updateLocal(LOCAL_KEYS.catalog, EMPTY.catalog, (draft) => {
//         const merged = { ...remote };

//         Object.values(draft.products).forEach((product) => {
//           if (product.pending && !merged[product.id]) {
//             merged[product.id] = product;
//           }
//         });

//         draft.products = merged;
//         draft.lastSyncMs = Date.now();
//       });

//       return snapshot.size;
//     })().finally(() => {
//       pullInFlight = null;
//     });
//   }

//   return pullInFlight;
// }

// /** Cantidad de productos registrados en el celular que todavía no se subieron. */
// export async function getPendingCount() {
//   const catalog = await readCatalog();
//   return Object.values(catalog.products).filter((p) => p.pending).length;
// }

// /**
//  * Registro en Firebase (usa el celular solo para decidir; acá se confirma).
//  * Si otro usuario ya lo había registrado, no lo pisa: queda el de él.
//  * También completa borradores viejos.
//  */
// async function registerProductRemote(productNumber, name, userId) {
//   const productId = productIdFromQr(productNumber);
//   const productRef = doc(db, PRODUCTS, productId);

//   return runTransaction(db, async (transaction) => {
//     const productSnap = await transaction.get(productRef);
//     const now = new Date();

//     if (!productSnap.exists()) {
//       transaction.set(productRef, {
//         productNumber,
//         name,
//         status: "registered",
//         createdBy: userId,
//         createdAt: now,
//         updatedAt: now,
//         registeredAt: now,
//         registeredBy: userId,
//       });

//       return { id: productId, name, alreadyRegistered: false };
//     }

//     if ((productSnap.data().status || "registered") === "draft") {
//       transaction.update(productRef, {
//         name,
//         status: "registered",
//         updatedAt: now,
//         updatedBy: userId,
//         registeredAt: now,
//         registeredBy: userId,
//       });

//       return { id: productId, name, alreadyRegistered: false };
//     }

//     return {
//       id: productId,
//       name: productSnap.data().name || name,
//       alreadyRegistered: true,
//     };
//   });
// }

// /** Sube a Firebase los productos registrados sin conexión por este usuario. */
// export async function pushPendingRegistrations(userId) {
//   const catalog = await readCatalog();
//   const pending = Object.values(catalog.products).filter(
//     (p) => p.pending && (!p.pendingBy || p.pendingBy === userId),
//   );

//   let pushed = 0;
//   let failed = 0;

//   for (const product of pending) {
//     try {
//       const result = await withTimeout(
//         registerProductRemote(product.productNumber, product.name, userId),
//         REMOTE_TIMEOUT_MS,
//       );

//       await updateLocal(LOCAL_KEYS.catalog, EMPTY.catalog, (draft) => {
//         const current = draft.products[product.id];
//         if (current && current.pending) {
//           delete current.pending;
//           delete current.pendingBy;
//           current.name = result.name; // si otro lo había registrado, queda su descripción
//           current.status = "registered";
//           current.updatedAtMs = Date.now();
//         }
//       });

//       pushed += 1;
//     } catch (error) {
//       // Queda pendiente y se reintenta en la próxima sincronización
//       failed += 1;
//       console.warn("No se pudo subir un producto pendiente:", error);
//     }
//   }

//   return { pushed, failed };
// }

// // ---------------------------------------------------------------------------
// // Escaneo y registro (siempre contra el celular, funcionan sin conexión)
// // ---------------------------------------------------------------------------

// /**
//  * Escanea un código contra el catálogo del celular.
//  * - Producto registrado: suma 1 a la lista y devuelve state "registered".
//  * - Producto inexistente o en borrador viejo: NO escribe nada ni suma;
//  *   devuelve state "unregistered" para que la app pida la descripción.
//  * Los productos viejos sin campo `status` se consideran registrados.
//  */
// export async function scanProduct(qrData, userId) {
//   const cleanQr = (qrData || "").trim();
//   if (!cleanQr) {
//     throw new Error(i18n.t("productService.errors.emptyCode"));
//   }

//   if (!userId) {
//     throw new Error(i18n.t("productService.errors.noSession"));
//   }

//   const productId = productIdFromQr(cleanQr);
//   const catalog = await readCatalog();
//   const product = catalog.products[productId];
//   const status = product ? product.status || "registered" : null;

//   if (!product || status === "draft") {
//     return {
//       success: true,
//       id: productId,
//       productNumber: cleanQr,
//       state: "unregistered",
//       product: null,
//       countQuantity: null,
//     };
//   }

//   const countQuantity = await addToLocalCount(userId, productId, cleanQr);

//   return {
//     success: true,
//     id: productId,
//     productNumber: cleanQr,
//     state: "registered",
//     product: { ...product },
//     countQuantity,
//   };
// }

// /**
//  * Registra un producto nuevo con su descripción en el celular. NO lo suma a
//  * ninguna lista: el conteo se hace escaneando el producto ya registrado.
//  * Queda pendiente y se sube a Firebase solo cuando hay conexión.
//  */
// export async function registerProduct(qrData, description, userId) {
//   const cleanQr = (qrData || "").trim();
//   const name = String(description ?? "")
//     .trim()
//     .toUpperCase();

//   if (!cleanQr) {
//     throw new Error(i18n.t("productService.errors.emptyCode"));
//   }

//   if (!userId) {
//     throw new Error(i18n.t("productService.errors.noSession"));
//   }

//   if (!name) {
//     const err = new Error(i18n.t("productService.errors.emptyDescription"));
//     err.code = "empty-description";
//     throw err;
//   }

//   const productId = productIdFromQr(cleanQr);

//   const result = await updateLocal(
//     LOCAL_KEYS.catalog,
//     EMPTY.catalog,
//     (draft) => {
//       const existing = draft.products[productId];

//       if (existing && (existing.status || "registered") !== "draft") {
//         return {
//           id: productId,
//           name: existing.name || name,
//           alreadyRegistered: true,
//         };
//       }

//       draft.products[productId] = {
//         id: productId,
//         productNumber: cleanQr,
//         name,
//         status: "registered",
//         updatedAtMs: Date.now(),
//         pending: true,
//         pendingBy: userId,
//       };

//       return { id: productId, name, alreadyRegistered: false };
//     },
//   );

//   if (!result.alreadyRegistered) {
//     pendingChangeHandler?.();
//   }

//   return result;
// }

// // ---------------------------------------------------------------------------
// // Edición del administrador
// // ---------------------------------------------------------------------------

// /**
//  * Guarda la descripción de un producto existente (siempre en mayúsculas).
//  * - confirm = true: completa un borrador viejo y lo pasa a "registered".
//  * - confirm = false: edición de un producto registrado (solo administrador).
//  * Requiere conexión, salvo para productos que todavía no se subieron.
//  */
// export async function saveProductFields(
//   productId,
//   fields,
//   userId,
//   { confirm = false } = {},
// ) {
//   const name = String(fields?.name ?? "")
//     .trim()
//     .toUpperCase();

//   if (!name) {
//     return {
//       success: false,
//       message: i18n.t("productService.errors.descriptionRequired"),
//     };
//   }

//   const successMessage = confirm
//     ? i18n.t("productService.success.productRegistered")
//     : i18n.t("productService.success.changesSaved");

//   // Producto registrado en el celular que todavía no se subió:
//   // se corrige acá y se sube con la próxima sincronización
//   const catalog = await readCatalog();

//   if (catalog.products[productId]?.pending) {
//     await updateLocal(LOCAL_KEYS.catalog, EMPTY.catalog, (draft) => {
//       const current = draft.products[productId];

//       if (current) {
//         current.name = name;
//         current.updatedAtMs = Date.now();
//       }
//     });

//     pendingChangeHandler?.();

//     return { success: true, message: successMessage };
//   }

//   if (!(await isOnline())) {
//     return { success: false, message: offlineMessage() };
//   }

//   const now = new Date();

//   const payload = {
//     name,
//     updatedAt: now,
//     updatedBy: userId,
//   };

//   if (confirm) {
//     payload.status = "registered";
//     payload.registeredAt = now;
//     payload.registeredBy = userId;
//   }

//   try {
//     await withTimeout(
//       updateDoc(doc(db, PRODUCTS, productId), payload),
//       REMOTE_TIMEOUT_MS,
//     );

//     // Se actualiza también el catálogo del celular
//     await updateLocal(LOCAL_KEYS.catalog, EMPTY.catalog, (draft) => {
//       const current = draft.products[productId];
//       if (current) {
//         current.name = name;
//         current.updatedAtMs = now.getTime();
//         if (confirm) current.status = "registered";
//       }
//     });

//     return { success: true, message: successMessage };
//   } catch (error) {
//     if (error.code === "timeout") {
//       return { success: false, message: offlineMessage() };
//     }

//     if (error.code === "permission-denied") {
//       return {
//         success: false,
//         message: i18n.t("productService.errors.permissionDenied"),
//       };
//     }

//     console.error(i18n.t("productService.errors.saveConsole"), error);

//     throw error;
//   }
// }

// /** Actualización libre de campos (solo administrador, requiere conexión). */
// export async function updateProductData(productId, dataToUpdate, userId) {
//   if (!(await isOnline())) {
//     return { success: false, message: offlineMessage() };
//   }

//   const productRef = doc(db, PRODUCTS, productId);

//   try {
//     await withTimeout(
//       updateDoc(productRef, {
//         ...dataToUpdate,
//         updatedAt: new Date(),
//         lastScannedBy: userId,
//       }),
//       REMOTE_TIMEOUT_MS,
//     );

//     return {
//       success: true,
//       message: i18n.t("productService.success.productUpdated"),
//     };
//   } catch (error) {
//     if (error.code === "timeout") {
//       return { success: false, message: offlineMessage() };
//     }

//     if (error.code === "permission-denied") {
//       return {
//         success: false,
//         message: i18n.t("productService.errors.adminPermissionDenied"),
//       };
//     }

//     throw error;
//   }
// }

// // ---------------------------------------------------------------------------
// // Consultas para el Inicio (leen del celular)
// // ---------------------------------------------------------------------------

// async function readCatalogEnsuringFirstDownload() {
//   let catalog = await readCatalog();

//   // Primera vez en este celular: si hay conexión, se baja el catálogo
//   if (Object.keys(catalog.products).length === 0 && (await isOnline())) {
//     try {
//       await pullCatalog();
//       catalog = await readCatalog();
//     } catch (error) {
//       console.warn("No se pudo descargar el catálogo:", error);
//     }
//   }

//   return catalog;
// }

// /**
//  * Cantidad de productos del catálogo (los que compara el escáner).
//  * Devuelve null si no hay sesión (por ejemplo, justo al cerrar sesión).
//  */
// export async function getProductsCount() {
//   if (!getAuth().currentUser) return null;

//   const catalog = await readCatalogEnsuringFirstDownload();
//   return Object.keys(catalog.products).length;
// }

// /** Productos del catálogo del celular, los más recientes primero. */
// export async function getProducts() {
//   if (!getAuth().currentUser) return [];

//   try {
//     const catalog = await readCatalogEnsuringFirstDownload();

//     return Object.values(catalog.products).sort(
//       (a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0),
//     );
//   } catch (error) {
//     console.error(i18n.t("productService.errors.loadConsole"), error);

//     return [];
//   }
// }

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import i18n from "i18next";
import { db } from "../lib/firebase";
import { addToLocalCount, productIdFromQr } from "./countService";
import { EMPTY, LOCAL_KEYS, readLocal, updateLocal } from "./localStore";
import { isOnline, withTimeout } from "./network";

const PRODUCTS = "products";
const REMOTE_TIMEOUT_MS = 15000;

// Debe coincidir con el email de la función isAdmin() en las reglas de Firestore
export const ADMIN_EMAIL = "ale@a.com";

// La sincronización se registra acá para subir los cambios apenas se pueda
let pendingChangeHandler = null;

export function setPendingChangeHandler(handler) {
  pendingChangeHandler = handler;
}

function timestampToMs(value) {
  if (value && typeof value.toMillis === "function") return value.toMillis();
  return typeof value === "number" ? value : 0;
}

function toLocalProduct(id, data) {
  return {
    id,
    productNumber: data.productNumber || "",
    name: data.name || "",
    status: data.status || "registered",
    updatedAtMs: timestampToMs(data.updatedAt),
  };
}

function offlineMessage() {
  return i18n.t("productService.errors.offline", {
    defaultValue: "Necesitás conexión para modificar productos.",
  });
}

function readCatalog() {
  return readLocal(LOCAL_KEYS.catalog, EMPTY.catalog);
}

// Descripción comparable: sin tildes, sin espacios de más y en mayúsculas
function normalizeDescription(value) {
  let text = String(value ?? "");

  try {
    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    // Si el dispositivo no lo soporta, se compara tal cual
  }

  return text.replace(/\s+/g, " ").trim().toUpperCase();
}

/** Busca otro producto con la misma descripción. */
function findDuplicate(products, name, ignoreId) {
  const normalized = normalizeDescription(name);
  if (!normalized) return null;

  return (
    Object.values(products).find(
      (product) =>
        product.id !== ignoreId &&
        normalizeDescription(product.name) === normalized,
    ) || null
  );
}

function duplicateMessage(existing) {
  return i18n.t("pallets.duplicateDescription", {
    code: existing.productNumber,
  });
}

/**
 * true si la sesión actual es la del administrador (ADMIN_EMAIL).
 * No lee Firestore. Se mantiene async para no cambiar a quienes la llaman.
 */
export async function isAdminUser() {
  const email = getAuth().currentUser?.email;
  return (
    typeof email === "string" && email.trim().toLowerCase() === ADMIN_EMAIL
  );
}

/** Busca primero en el catálogo del celular; si no está y hay conexión, en Firebase. */
export async function getProductById(productId) {
  const catalog = await readCatalog();
  const local = catalog.products[productId];
  if (local) return { ...local };

  if (!(await isOnline())) return null;

  try {
    const snap = await withTimeout(getDoc(doc(db, PRODUCTS, productId)), 5000);
    if (!snap.exists()) return null;
    return toLocalProduct(snap.id, snap.data());
  } catch (error) {
    console.warn(i18n.t("productService.errors.loadConsole"), error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sincronización con Firebase
// ---------------------------------------------------------------------------

let pullInFlight = null;

/**
 * Baja el catálogo completo de Firebase al celular.
 * Los productos registrados en el celular que todavía no se subieron se conservan.
 */
export function pullCatalog() {
  if (!pullInFlight) {
    pullInFlight = (async () => {
      const snapshot = await getDocs(collection(db, PRODUCTS));

      // Sin conexión Firestore puede devolver datos de su caché (vacíos):
      // no se usan, para no borrar el catálogo guardado.
      if (snapshot.metadata.fromCache) {
        const err = new Error("offline");
        err.code = "offline";
        throw err;
      }

      const remote = {};
      snapshot.docs.forEach((item) => {
        remote[item.id] = toLocalProduct(item.id, item.data());
      });

      await updateLocal(LOCAL_KEYS.catalog, EMPTY.catalog, (draft) => {
        const merged = { ...remote };

        Object.values(draft.products).forEach((product) => {
          if (product.pending && !merged[product.id]) {
            merged[product.id] = product;
          }
        });

        draft.products = merged;
        draft.lastSyncMs = Date.now();
      });

      return snapshot.size;
    })().finally(() => {
      pullInFlight = null;
    });
  }

  return pullInFlight;
}

/** Cantidad de productos registrados en el celular que todavía no se subieron. */
export async function getPendingCount() {
  const catalog = await readCatalog();
  return Object.values(catalog.products).filter((p) => p.pending).length;
}

/**
 * Registro en Firebase (usa el celular solo para decidir; acá se confirma).
 * Si otro usuario ya lo había registrado, no lo pisa: queda el de él.
 * También completa borradores viejos.
 */
async function registerProductRemote(productNumber, name, userId) {
  const productId = productIdFromQr(productNumber);
  const productRef = doc(db, PRODUCTS, productId);

  return runTransaction(db, async (transaction) => {
    const productSnap = await transaction.get(productRef);
    const now = new Date();

    if (!productSnap.exists()) {
      transaction.set(productRef, {
        productNumber,
        name,
        status: "registered",
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        registeredAt: now,
        registeredBy: userId,
      });

      return { id: productId, name, alreadyRegistered: false };
    }

    if ((productSnap.data().status || "registered") === "draft") {
      transaction.update(productRef, {
        name,
        status: "registered",
        updatedAt: now,
        updatedBy: userId,
        registeredAt: now,
        registeredBy: userId,
      });

      return { id: productId, name, alreadyRegistered: false };
    }

    return {
      id: productId,
      name: productSnap.data().name || name,
      alreadyRegistered: true,
    };
  });
}

/** Sube a Firebase los productos registrados sin conexión por este usuario. */
export async function pushPendingRegistrations(userId) {
  const catalog = await readCatalog();
  const pending = Object.values(catalog.products).filter(
    (p) => p.pending && (!p.pendingBy || p.pendingBy === userId),
  );

  let pushed = 0;
  let failed = 0;

  for (const product of pending) {
    try {
      const result = await withTimeout(
        registerProductRemote(product.productNumber, product.name, userId),
        REMOTE_TIMEOUT_MS,
      );

      await updateLocal(LOCAL_KEYS.catalog, EMPTY.catalog, (draft) => {
        const current = draft.products[product.id];
        if (current && current.pending) {
          delete current.pending;
          delete current.pendingBy;
          current.name = result.name; // si otro lo había registrado, queda su descripción
          current.status = "registered";
          current.updatedAtMs = Date.now();
        }
      });

      pushed += 1;
    } catch (error) {
      // Queda pendiente y se reintenta en la próxima sincronización
      failed += 1;
      console.warn("No se pudo subir un producto pendiente:", error);
    }
  }

  return { pushed, failed };
}

// ---------------------------------------------------------------------------
// Escaneo y registro (siempre contra el celular, funcionan sin conexión)
// ---------------------------------------------------------------------------

/**
 * Escanea un código contra el catálogo del celular.
 * - Producto registrado: suma 1 a la lista, en el palet en curso, y devuelve
 *   state "registered" con countQuantity (total), pallet y pallets (detalle).
 * - Producto inexistente o en borrador viejo: NO escribe nada ni suma;
 *   devuelve state "unregistered" para que la app pida la descripción.
 * Los productos viejos sin campo `status` se consideran registrados.
 */
export async function scanProduct(qrData, userId) {
  const cleanQr = (qrData || "").trim();
  if (!cleanQr) {
    throw new Error(i18n.t("productService.errors.emptyCode"));
  }

  if (!userId) {
    throw new Error(i18n.t("productService.errors.noSession"));
  }

  const productId = productIdFromQr(cleanQr);
  const catalog = await readCatalog();
  const product = catalog.products[productId];
  const status = product ? product.status || "registered" : null;

  if (!product || status === "draft") {
    return {
      success: true,
      id: productId,
      productNumber: cleanQr,
      state: "unregistered",
      product: null,
      countQuantity: null,
      pallet: null,
      pallets: null,
    };
  }

  const counted = await addToLocalCount(userId, productId, cleanQr);

  return {
    success: true,
    id: productId,
    productNumber: cleanQr,
    state: "registered",
    product: { ...product },
    countQuantity: counted.quantity,
    pallet: counted.pallet,
    pallets: counted.pallets,
  };
}

/**
 * Registra un producto nuevo con su descripción en el celular. NO lo suma a
 * ninguna lista: el conteo se hace escaneando el producto ya registrado.
 * Si ya existe otro producto con esa descripción, lanza "duplicate-description".
 * Queda pendiente y se sube a Firebase solo cuando hay conexión.
 */
export async function registerProduct(qrData, description, userId) {
  const cleanQr = (qrData || "").trim();
  const name = String(description ?? "")
    .trim()
    .toUpperCase();

  if (!cleanQr) {
    throw new Error(i18n.t("productService.errors.emptyCode"));
  }

  if (!userId) {
    throw new Error(i18n.t("productService.errors.noSession"));
  }

  if (!name) {
    const err = new Error(i18n.t("productService.errors.emptyDescription"));
    err.code = "empty-description";
    throw err;
  }

  const productId = productIdFromQr(cleanQr);

  const result = await updateLocal(
    LOCAL_KEYS.catalog,
    EMPTY.catalog,
    (draft) => {
      const existing = draft.products[productId];

      if (existing && (existing.status || "registered") !== "draft") {
        return {
          id: productId,
          name: existing.name || name,
          alreadyRegistered: true,
        };
      }

      // La misma descripción en otro código sería el mismo producto repetido
      const duplicate = findDuplicate(draft.products, name, productId);

      if (duplicate) {
        const err = new Error(duplicateMessage(duplicate));
        err.code = "duplicate-description";
        err.existingCode = duplicate.productNumber;
        throw err;
      }

      draft.products[productId] = {
        id: productId,
        productNumber: cleanQr,
        name,
        status: "registered",
        updatedAtMs: Date.now(),
        pending: true,
        pendingBy: userId,
      };

      return { id: productId, name, alreadyRegistered: false };
    },
  );

  if (!result.alreadyRegistered) {
    pendingChangeHandler?.();
  }

  return result;
}

// ---------------------------------------------------------------------------
// Edición del administrador
// ---------------------------------------------------------------------------

/**
 * Guarda la descripción de un producto existente (siempre en mayúsculas).
 * - confirm = true: completa un borrador viejo y lo pasa a "registered".
 * - confirm = false: edición de un producto registrado (solo administrador).
 * No permite una descripción que ya tenga otro producto.
 * Requiere conexión, salvo para productos que todavía no se subieron.
 */
export async function saveProductFields(
  productId,
  fields,
  userId,
  { confirm = false } = {},
) {
  const name = String(fields?.name ?? "")
    .trim()
    .toUpperCase();

  if (!name) {
    return {
      success: false,
      message: i18n.t("productService.errors.descriptionRequired"),
    };
  }

  const successMessage = confirm
    ? i18n.t("productService.success.productRegistered")
    : i18n.t("productService.success.changesSaved");

  const catalog = await readCatalog();

  const duplicate = findDuplicate(catalog.products, name, productId);

  if (duplicate) {
    return { success: false, message: duplicateMessage(duplicate) };
  }

  // Producto registrado en el celular que todavía no se subió:
  // se corrige acá y se sube con la próxima sincronización
  if (catalog.products[productId]?.pending) {
    await updateLocal(LOCAL_KEYS.catalog, EMPTY.catalog, (draft) => {
      const current = draft.products[productId];

      if (current) {
        current.name = name;
        current.updatedAtMs = Date.now();
      }
    });

    pendingChangeHandler?.();

    return { success: true, message: successMessage };
  }

  if (!(await isOnline())) {
    return { success: false, message: offlineMessage() };
  }

  const now = new Date();

  const payload = {
    name,
    updatedAt: now,
    updatedBy: userId,
  };

  if (confirm) {
    payload.status = "registered";
    payload.registeredAt = now;
    payload.registeredBy = userId;
  }

  try {
    await withTimeout(
      updateDoc(doc(db, PRODUCTS, productId), payload),
      REMOTE_TIMEOUT_MS,
    );

    // Se actualiza también el catálogo del celular
    await updateLocal(LOCAL_KEYS.catalog, EMPTY.catalog, (draft) => {
      const current = draft.products[productId];
      if (current) {
        current.name = name;
        current.updatedAtMs = now.getTime();
        if (confirm) current.status = "registered";
      }
    });

    return { success: true, message: successMessage };
  } catch (error) {
    if (error.code === "timeout") {
      return { success: false, message: offlineMessage() };
    }

    if (error.code === "permission-denied") {
      return {
        success: false,
        message: i18n.t("productService.errors.permissionDenied"),
      };
    }

    console.error(i18n.t("productService.errors.saveConsole"), error);

    throw error;
  }
}

/** Actualización libre de campos (solo administrador, requiere conexión). */
export async function updateProductData(productId, dataToUpdate, userId) {
  if (!(await isOnline())) {
    return { success: false, message: offlineMessage() };
  }

  const productRef = doc(db, PRODUCTS, productId);

  try {
    await withTimeout(
      updateDoc(productRef, {
        ...dataToUpdate,
        updatedAt: new Date(),
        lastScannedBy: userId,
      }),
      REMOTE_TIMEOUT_MS,
    );

    return {
      success: true,
      message: i18n.t("productService.success.productUpdated"),
    };
  } catch (error) {
    if (error.code === "timeout") {
      return { success: false, message: offlineMessage() };
    }

    if (error.code === "permission-denied") {
      return {
        success: false,
        message: i18n.t("productService.errors.adminPermissionDenied"),
      };
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Consultas para el Inicio (leen del celular)
// ---------------------------------------------------------------------------

async function readCatalogEnsuringFirstDownload() {
  let catalog = await readCatalog();

  // Primera vez en este celular: si hay conexión, se baja el catálogo
  if (Object.keys(catalog.products).length === 0 && (await isOnline())) {
    try {
      await pullCatalog();
      catalog = await readCatalog();
    } catch (error) {
      console.warn("No se pudo descargar el catálogo:", error);
    }
  }

  return catalog;
}

/**
 * Cantidad de productos del catálogo (los que compara el escáner).
 * Devuelve null si no hay sesión (por ejemplo, justo al cerrar sesión).
 */
export async function getProductsCount() {
  if (!getAuth().currentUser) return null;

  const catalog = await readCatalogEnsuringFirstDownload();
  return Object.keys(catalog.products).length;
}

/** Productos del catálogo del celular, los más recientes primero. */
export async function getProducts() {
  if (!getAuth().currentUser) return [];

  try {
    const catalog = await readCatalogEnsuringFirstDownload();

    return Object.values(catalog.products).sort(
      (a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0),
    );
  } catch (error) {
    console.error(i18n.t("productService.errors.loadConsole"), error);

    return [];
  }
}
