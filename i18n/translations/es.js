export default {
  tabs: {
    home: "Inicio",
    list: "Lista",
    history: "Historial",
  },

  common: {
    cancel: "Cancelar",
    delete: "Eliminar",
    error: "Error",
    ok: "OK",
  },

  history: {
    screenTitle: "Historial",
    title: "Historial de listas",

    savedLists_one: "{{count}} lista guardada",
    savedLists_other: "{{count}} listas guardadas",

    recordSummary: "{{units}} unidades · {{products}} productos",

    recordDates: "Iniciada el {{started}} · Cerrada el {{closed}}",

    noDescription: "SIN DESCRIPCIÓN",

    empty:
      "Todavía no hay listas guardadas. Se guardan al tocar “Finalizado” o “Eliminar lista”.",

    buttons: {
      reopen: "Reabrir lista",
      delete: "Eliminar",
      clearAll: "Borrar todo el historial",
      viewList: "Ver lista",
    },

    alerts: {
      clearTitle: "Borrar historial",

      clearMessage:
        "Se eliminarán todas las listas guardadas en tu historial. Tu lista actual y los productos registrados no se tocan. ¿Querés continuar?",

      reopenedTitle: "Lista reabierta",

      reopenedMessage:
        "Ya está en la pestaña Lista. Cuando la finalices de nuevo, vuelve al historial.",

      reopenTitle: "Reabrir lista",

      reopenMessage:
        "Esta lista pasará a ser tu lista actual, con sus cantidades, y se quitará del historial hasta que la vuelvas a finalizar.",

      listAlreadyOpenTitle: "Ya tenés una lista en curso",

      listAlreadyOpenMessage:
        "Finalizala o eliminala desde la pestaña Lista antes de reabrir otra.",

      deleteRecordTitle: "Eliminar lista del historial",

      deleteRecordMessage:
        "Se eliminará la lista del {{date}} ({{units}} unidades de {{products}} productos). Las demás listas, tu lista actual y los productos registrados no se tocan. Esta acción no se puede deshacer.",
    },

    errors: {
      load: "No se pudo cargar el historial.",
      clear: "No se pudo borrar el historial.",
      reopen: "No se pudo reabrir la lista.",
      delete: "No se pudo eliminar la lista del historial.",

      loadConsole: "Error al cargar el historial:",
      clearConsole: "Error al borrar el historial:",
      reopenConsole: "Error al reabrir la lista:",
      deleteConsole: "Error al eliminar la lista del historial:",
    },
  },

  home: {
    user: "usuario",
    greeting: "Hola, {{name}}",
    admin: "ADMINISTRADOR",
    subtitle: "Escaneá tu producto para registrarlo.",
    scanButton: "Escanear QR",
    scanButtonSubtitle: "Toca para comenzar",
    registeredProducts: "Productos registrados en la base",
    productsSection: "Productos en la base",
    searchPlaceholder: "Buscar producto...",
    noDescription: "SIN DESCRIPCIÓN",
    draft: "BORRADOR",
    noProductsFound: "No se encontraron productos.",
    noProducts: "Todavía no hay productos registrados.",

    errors: {
      countProducts: "Error al contar productos:",
      logout: "Error al cerrar sesión:",
      logoutMessage: "No se pudo cerrar la sesión. Intentá de nuevo.",
    },
  },
  list: {
    title: "Mi lista",

    startedAt: "Iniciada el {{date}}",

    totalInList: "Total en la lista",
    differentProducts: "Productos distintos",

    loading: "Cargando...",
    noDescription: "SIN DESCRIPCIÓN",
    completeHint: "Tocá para completar",

    thisProduct: "este producto",

    empty: "Todavía no leíste ningún código. Escaneá desde el inicio.",

    buttons: {
      remove: "Quitar",
      finalize: "Finalizar",
      finalized: "Finalizado",
      deleteList: "Eliminar lista",
    },

    alerts: {
      removeTitle: "Quitar de la lista",

      removeMessage:
        "¿Quitar {{label}} de tu lista? El producto sigue registrado en la base.",

      emptyTitle: "Lista vacía",

      emptyMessage: "Todavía no leíste ningún código.",

      finalizeTitle: "Finalizar lista",

      finalizeMessage:
        "Se guardará tu lista ({{units}} unidades de {{products}} productos) en el historial y quedará vacía para empezar una nueva. Desde el historial podés reabrirla.",

      finalizedTitle: "Lista finalizada",

      finalizedMessage:
        "Quedó guardada en tu historial. Ya podés empezar una nueva.",

      deleteTitle: "Eliminar lista",

      deleteMessageWithItems:
        "Se guardará una copia en tu historial y se borrará la lista de la base de datos. Los productos registrados NO se eliminan.",

      deleteMessageEmpty:
        "Se borrará la lista. Los productos registrados NO se eliminan.",
    },

    errors: {
      load: "No se pudo cargar la lista.",
      decrement: "No se pudo restar la cantidad.",
      remove: "No se pudo quitar el producto de la lista.",

      finalize:
        "No se pudo finalizar la lista. Si falló el guardado en el historial, la lista no se borró.",

      delete:
        "No se pudo eliminar la lista. Si falló el guardado en el historial, la lista no se borró.",

      productReadConsole: "No se pudo leer el producto:",

      loadConsole: "Error al cargar la lista:",
    },
  },
  productDetail: {
    loading: "Cargando producto...",
    productNumber: "N° de producto",
    quantityRead: "Cantidad leída",
    scanAgain: "Escanear de nuevo",
  },
  changePassword: {
    title: "Cambiar contraseña",
    account: "Cuenta",

    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmPassword: "Repetir nueva contraseña",

    showPasswords: "Mostrar contraseñas",
    hidePasswords: "Ocultar contraseñas",

    changeButton: "Cambiar contraseña",

    errors: {
      currentRequired: "Ingresá tu contraseña actual.",

      minLength:
        "La nueva contraseña debe tener al menos {{length}} caracteres.",

      samePassword: "La nueva contraseña debe ser distinta de la actual.",

      notMatch: "Las contraseñas nuevas no coinciden.",

      changeConsole: "Error al cambiar la contraseña:",
    },

    alerts: {
      successTitle: "Contraseña actualizada",

      successMessage:
        "Ya podés usar tu nueva contraseña la próxima vez que ingreses.",
    },
  },
  count: {
    title: "Mi lista de hoy",
    finalized: "FINALIZADA",

    totalInList: "Total en la lista",
    differentProducts: "Productos distintos",

    loading: "Cargando...",
    noDescription: "SIN DESCRIPCIÓN",
    completeDescription: "Tocá para completar",

    noScansToday: "Todavía no leíste ningún código hoy.",

    productFallback: "este producto",

    reopen: "Reabrir lista",
    finalizeButton: "Finalizar",
    deleteList: "Eliminar lista",

    remove: {
      title: "Quitar de la lista",

      message:
        "¿Quitar {{product}} de tu lista? El producto sigue registrado en la base.",
    },

    empty: {
      title: "Lista vacía",

      message: "Todavía no leíste ningún código hoy.",
    },

    finalize: {
      title: "Finalizar lista",

      message:
        "Vas a cerrar tu lista con {{units}} unidades de {{products}} productos. No podrás seguir escaneando hasta reabrirla.",

      confirm: "Finalizar",

      successTitle: "Lista finalizada",

      successMessage: "Tu lista quedó guardada.",
    },

    delete: {
      title: "Eliminar lista",

      message:
        "Se borrará de la base de datos tu lista de hoy completa. Los productos registrados NO se eliminan. Esta acción no se puede deshacer.",
    },

    errors: {
      readProduct: "No se pudo leer el producto:",

      loadList: "No se pudo cargar la lista.",

      readStatus: "Error al leer el estado de la lista:",

      decrement: "No se pudo restar la cantidad.",

      removeProduct: "No se pudo quitar el producto de la lista.",

      finalize: "No se pudo finalizar la lista.",

      reopen: "No se pudo reabrir la lista.",

      deleteList: "No se pudo eliminar la lista.",
    },
  },
  login: {
    email: "Correo electrónico",
    password: "Contraseña",

    loginButton: "Iniciar sesión",
    loggingIn: "Ingresando...",

    poweredBy: "Powered by Alejandro Sklar",

    alerts: {
      incompleteTitle: "Datos incompletos",

      incompleteMessage: "Ingresá tu correo y contraseña.",

      errorTitle: "No se pudo iniciar sesión",

      errorMessage: "Revisá el correo y la contraseña.",
    },
  },
  productForm: {
    title: "Producto",

    productCode: "Código leído",
    statusLabel: "Estado",

    description: "Descripción",

    descriptionPlaceholder: "DESCRIPCIÓN DEL PRODUCTO",

    adminOnly: "Esta sección es solo para el administrador.",

    back: "Volver",

    draftNotice:
      "Este producto todavía no tiene alta. Al guardar la descripción queda registrado.",

    status: {
      draft: "Sin registrar (borrador)",
      registered: "Registrado",
    },

    buttons: {
      save: "Guardar",
      edit: "Modificar",
    },

    alerts: {
      missingDescriptionTitle: "Falta la descripción",

      missingDescriptionMessage: "La descripción no puede quedar vacía.",

      saveErrorTitle: "No se pudo guardar",

      savedTitle: "Guardado",

      savedMessage: "Los cambios se guardaron correctamente.",
    },

    errors: {
      notFound: "No se encontró el producto.",

      load: "No se pudo cargar el producto.",

      save: "Ocurrió un problema al guardar el producto.",

      loadConsole: "Error al cargar el producto:",

      saveConsole: "Error al guardar el producto:",
    },
  },
  scanResult: {
    newProduct: "Producto registrado",

    scanRegistered: "Lectura registrada",

    subtitle: "El producto se agregó a la lista y se actualizó la cantidad.",

    productNumber: "N° de producto",

    quantity: "Cantidad",

    scanAnother: "Escanear otro",

    viewProducts: "Ver lista de productos",
  },
  scan: {
    permissionMessage:
      "Necesitamos acceso a la cámara para poder escanear los códigos QR.",

    grantPermission: "Conceder permiso",

    title: "Escaneando Código",

    instructions: {
      ready: "Apuntá al código de barras o QR",
      starting: "Iniciando cámara...",
    },

    viewList: "Ver mi lista",

    banner: {
      inList: "En tu lista: {{count}}",

      alreadyRegistered:
        "Ya estaba registrado. Escanealo de nuevo para sumarlo.",

      registered: "Registrado. Escanealo de nuevo para sumarlo a tu lista.",

      cancelledTitle: "Producto nuevo cancelado",

      cancelledSubtitle: "No se registró ni se sumó",
    },

    alerts: {
      finalizedTitle: "Lista finalizada",

      viewList: "Ver mi lista",

      close: "Cerrar",

      retry: "Reintentar",

      missingDescriptionTitle: "Falta la descripción",

      missingDescriptionMessage:
        "Escribí la descripción del producto para poder registrarlo.",

      registerErrorTitle: "No se pudo registrar",
    },

    errors: {
      processConsole: "Error al procesar el código:",

      registerConsole: "Error al registrar el producto:",

      cameraConsole: "Error al montar la cámara:",

      permissionDenied:
        "Firestore rechazó la operación. Verificá tu sesión y las reglas.",

      process: "Ocurrió un problema al procesar el código.",

      register: "Ocurrió un problema y el producto no se registró.",

      cameraStart: "No se pudo iniciar la cámara.",
    },

    newProductTitle: "✨ Producto nuevo",

    newProductMessage:
      "Este código no está registrado. Escribí la descripción para darlo de alta. Registrarlo no lo suma a tu lista: después escanealo de nuevo para contarlo.",

    productCode: "Código leído",

    description: "Descripción",

    descriptionPlaceholder: "DESCRIPCIÓN DEL PRODUCTO",

    register: "Registrar",
  },
  logo: {
    tagline: "Escaneá · Registrá · Controlá",
  },
  changePasswordService: {
    errors: {
      noSession: "No hay una sesión activa. Volvé a ingresar.",

      wrongPassword: "La contraseña actual no es correcta.",

      weakPassword:
        "La nueva contraseña es muy débil. Usá al menos 6 caracteres.",

      tooManyRequests:
        "Demasiados intentos. Esperá unos minutos y volvé a probar.",

      network: "Sin conexión. Revisá tu internet e intentá de nuevo.",

      recentLogin: "Por seguridad, cerrá sesión, volvé a ingresar y reintentá.",

      default: "No se pudo cambiar la contraseña. Intentá de nuevo.",
    },
  },
  countService: {
    errors: {
      listNotEmpty: "Ya hay una lista en curso.",

      clearPreviousStateConsole:
        "No se pudo limpiar el estado anterior de la lista:",
    },
  },
  historyService: {
    errors: {
      noSession: "No hay una sesión activa.",
    },
  },
  productService: {
    errors: {
      emptyCode: "El código está vacío.",

      noSession: "No hay una sesión activa.",

      emptyDescription: "Ingresá la descripción del producto.",

      descriptionRequired: "La descripción es obligatoria.",

      permissionDenied: "No tenés permisos para modificar este producto.",

      adminPermissionDenied:
        "Acceso denegado. Se requieren permisos de Administrador para modificar el producto.",

      saveConsole: "Error al guardar el producto:",

      loadConsole: "Error al obtener productos:",
    },

    success: {
      productRegistered: "Producto registrado.",

      changesSaved: "Cambios guardados.",

      productUpdated: "Producto actualizado correctamente.",
    },
  },
};
