// import {
//   collection,
//   doc,
//   getCountFromServer,
//   getDoc,
//   getDocs,
//   limit,
//   orderBy,
//   query,
//   runTransaction,
//   updateDoc,
// } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { db } from "../lib/firebase";
// import { countItemRef, productIdFromQr } from "./countService";

// const PRODUCTS = "products";

// // Debe coincidir con el email de la función isAdmin() en las reglas de Firestore
// export const ADMIN_EMAIL = "ale@a.com";

// /** Suma 1 al renglón de la lista (lo crea si no existe). Devuelve la cantidad. */
// function addToCount(
//   transaction,
//   itemSnap,
//   itemRef,
//   productNumber,
//   userId,
//   now,
// ) {
//   if (itemSnap.exists()) {
//     const next = Number(itemSnap.data().quantity || 0) + 1;
//     transaction.update(itemRef, { quantity: next, updatedAt: now });
//     return next;
//   }

//   transaction.set(itemRef, {
//     productNumber,
//     quantity: 1,
//     countedBy: userId,
//     createdAt: now,
//     updatedAt: now,
//   });
//   return 1;
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

// export async function getProductById(productId) {
//   const snap = await getDoc(doc(db, PRODUCTS, productId));
//   if (!snap.exists()) return null;
//   return { id: snap.id, ...snap.data() };
// }

// /**
//  * Cantidad de productos registrados en la base (los que compara el escáner).
//  * Devuelve null si no hay sesión (por ejemplo, justo al cerrar sesión).
//  */
// export async function getProductsCount() {
//   if (!getAuth().currentUser) return null;

//   const snapshot = await getCountFromServer(collection(db, PRODUCTS));
//   return snapshot.data().count;
// }

// /**
//  * Escanea un código.
//  * - Producto registrado: suma 1 a la lista y devuelve state "registered".
//  * - Producto inexistente o en borrador viejo: NO escribe nada ni suma;
//  *   devuelve state "unregistered" para que la app pida la descripción.
//  * Los productos viejos sin campo `status` se consideran registrados.
//  */
// export async function scanProduct(qrData, userId) {
//   const cleanQr = (qrData || "").trim();
//   if (!cleanQr) throw new Error("El código está vacío.");
//   if (!userId) throw new Error("No hay una sesión activa.");

//   const productId = productIdFromQr(cleanQr);
//   const productRef = doc(db, PRODUCTS, productId);
//   const itemRef = countItemRef(userId, productId);

//   const result = await runTransaction(db, async (transaction) => {
//     // Primero todas las lecturas, después las escrituras
//     const productSnap = await transaction.get(productRef);
//     const status = productSnap.exists()
//       ? productSnap.data().status || "registered"
//       : null;

//     // No registrado: no se escribe nada ni se cuenta
//     if (!productSnap.exists() || status === "draft") {
//       return { state: "unregistered", product: null, countQuantity: null };
//     }

//     const itemSnap = await transaction.get(itemRef);

//     const countQuantity = addToCount(
//       transaction,
//       itemSnap,
//       itemRef,
//       cleanQr,
//       userId,
//       new Date(),
//     );

//     return {
//       state: "registered",
//       product: { id: productId, ...productSnap.data() },
//       countQuantity,
//     };
//   });

//   return { success: true, id: productId, productNumber: cleanQr, ...result };
// }

// /**
//  * Registra un producto nuevo con su descripción. NO lo suma a ninguna lista:
//  * el conteo se hace escaneando el producto ya registrado.
//  * También completa borradores viejos. Si otro usuario lo registró mientras
//  * tanto, no lo pisa.
//  */
// export async function registerProduct(qrData, description, userId) {
//   const cleanQr = (qrData || "").trim();
//   const name = String(description ?? "")
//     .trim()
//     .toUpperCase();

//   if (!cleanQr) throw new Error("El código está vacío.");
//   if (!userId) throw new Error("No hay una sesión activa.");
//   if (!name) {
//     const err = new Error("Ingresá la descripción del producto.");
//     err.code = "empty-description";
//     throw err;
//   }

//   const productId = productIdFromQr(cleanQr);
//   const productRef = doc(db, PRODUCTS, productId);

//   return runTransaction(db, async (transaction) => {
//     const productSnap = await transaction.get(productRef);
//     const now = new Date();

//     if (!productSnap.exists()) {
//       transaction.set(productRef, {
//         productNumber: cleanQr,
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

// /**
//  * Guarda la descripción de un producto existente (siempre en mayúsculas).
//  * - confirm = true:  completa un borrador viejo y lo pasa a "registered".
//  * - confirm = false: edición de un producto registrado (solo administrador).
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
//     return { success: false, message: "La descripción es obligatoria." };
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
//     await updateDoc(doc(db, PRODUCTS, productId), payload);
//     return {
//       success: true,
//       message: confirm ? "Producto registrado." : "Cambios guardados.",
//     };
//   } catch (error) {
//     if (error.code === "permission-denied") {
//       return {
//         success: false,
//         message: "No tenés permisos para modificar este producto.",
//       };
//     }
//     console.error("Error al guardar el producto:", error);
//     throw error;
//   }
// }

// /** Actualización libre de campos (solo administrador). */
// export async function updateProductData(productId, dataToUpdate, userId) {
//   const productRef = doc(db, PRODUCTS, productId);

//   try {
//     await updateDoc(productRef, {
//       ...dataToUpdate,
//       updatedAt: new Date(),
//       lastScannedBy: userId,
//     });
//     return { success: true, message: "Producto actualizado correctamente." };
//   } catch (error) {
//     if (error.code === "permission-denied") {
//       return {
//         success: false,
//         message:
//           "Acceso denegado. Se requieren permisos de Administrador para modificar el producto.",
//       };
//     }
//     throw error;
//   }
// }

// export async function getProducts() {
//   // Sin sesión (por ejemplo, justo al cerrar sesión) no se consulta nada
//   if (!getAuth().currentUser) return [];

//   try {
//     const productsQuery = query(
//       collection(db, PRODUCTS),
//       orderBy("updatedAt", "desc"),
//       limit(200),
//     );

//     const snapshot = await getDocs(productsQuery);

//     if (snapshot.empty) {
//       return [];
//     }

//     return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
//   } catch (error) {
//     console.error("Error al obtener productos:", error);
//     return [];
//   }
// }

import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import i18n from "i18next";
import { db } from "../lib/firebase";
import { countItemRef, productIdFromQr } from "./countService";

const PRODUCTS = "products";

// Debe coincidir con el email de la función isAdmin() en las reglas de Firestore
export const ADMIN_EMAIL = "ale@a.com";

/** Suma 1 al renglón de la lista (lo crea si no existe). Devuelve la cantidad. */
function addToCount(
  transaction,
  itemSnap,
  itemRef,
  productNumber,
  userId,
  now,
) {
  if (itemSnap.exists()) {
    const next = Number(itemSnap.data().quantity || 0) + 1;
    transaction.update(itemRef, { quantity: next, updatedAt: now });
    return next;
  }

  transaction.set(itemRef, {
    productNumber,
    quantity: 1,
    countedBy: userId,
    createdAt: now,
    updatedAt: now,
  });
  return 1;
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

export async function getProductById(productId) {
  const snap = await getDoc(doc(db, PRODUCTS, productId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Cantidad de productos registrados en la base (los que compara el escáner).
 * Devuelve null si no hay sesión (por ejemplo, justo al cerrar sesión).
 */
export async function getProductsCount() {
  if (!getAuth().currentUser) return null;

  const snapshot = await getCountFromServer(collection(db, PRODUCTS));
  return snapshot.data().count;
}

/**
 * Escanea un código.
 * - Producto registrado: suma 1 a la lista y devuelve state "registered".
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
  const productRef = doc(db, PRODUCTS, productId);
  const itemRef = countItemRef(userId, productId);

  const result = await runTransaction(db, async (transaction) => {
    // Primero todas las lecturas, después las escrituras
    const productSnap = await transaction.get(productRef);
    const status = productSnap.exists()
      ? productSnap.data().status || "registered"
      : null;

    // No registrado: no se escribe nada ni se cuenta
    if (!productSnap.exists() || status === "draft") {
      return {
        state: "unregistered",
        product: null,
        countQuantity: null,
      };
    }

    const itemSnap = await transaction.get(itemRef);

    const countQuantity = addToCount(
      transaction,
      itemSnap,
      itemRef,
      cleanQr,
      userId,
      new Date(),
    );

    return {
      state: "registered",
      product: { id: productId, ...productSnap.data() },
      countQuantity,
    };
  });

  return {
    success: true,
    id: productId,
    productNumber: cleanQr,
    ...result,
  };
}

/**
 * Registra un producto nuevo con su descripción. NO lo suma a ninguna lista:
 * el conteo se hace escaneando el producto ya registrado.
 * También completa borradores viejos. Si otro usuario lo registró mientras
 * tanto, no lo pisa.
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
  const productRef = doc(db, PRODUCTS, productId);

  return runTransaction(db, async (transaction) => {
    const productSnap = await transaction.get(productRef);
    const now = new Date();

    if (!productSnap.exists()) {
      transaction.set(productRef, {
        productNumber: cleanQr,
        name,
        status: "registered",
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        registeredAt: now,
        registeredBy: userId,
      });

      return {
        id: productId,
        name,
        alreadyRegistered: false,
      };
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

      return {
        id: productId,
        name,
        alreadyRegistered: false,
      };
    }

    return {
      id: productId,
      name: productSnap.data().name || name,
      alreadyRegistered: true,
    };
  });
}

/**
 * Guarda la descripción de un producto existente (siempre en mayúsculas).
 * - confirm = true: completa un borrador viejo y lo pasa a "registered".
 * - confirm = false: edición de un producto registrado (solo administrador).
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
    await updateDoc(doc(db, PRODUCTS, productId), payload);

    return {
      success: true,
      message: confirm
        ? i18n.t("productService.success.productRegistered")
        : i18n.t("productService.success.changesSaved"),
    };
  } catch (error) {
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

/** Actualización libre de campos (solo administrador). */
export async function updateProductData(productId, dataToUpdate, userId) {
  const productRef = doc(db, PRODUCTS, productId);

  try {
    await updateDoc(productRef, {
      ...dataToUpdate,
      updatedAt: new Date(),
      lastScannedBy: userId,
    });

    return {
      success: true,
      message: i18n.t("productService.success.productUpdated"),
    };
  } catch (error) {
    if (error.code === "permission-denied") {
      return {
        success: false,
        message: i18n.t("productService.errors.adminPermissionDenied"),
      };
    }

    throw error;
  }
}

export async function getProducts() {
  // Sin sesión (por ejemplo, justo al cerrar sesión) no se consulta nada
  if (!getAuth().currentUser) return [];

  try {
    const productsQuery = query(
      collection(db, PRODUCTS),
      orderBy("updatedAt", "desc"),
      limit(200),
    );

    const snapshot = await getDocs(productsQuery);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  } catch (error) {
    console.error(i18n.t("productService.errors.loadConsole"), error);

    return [];
  }
}
