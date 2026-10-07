export default {
  tabs: {
    home: "Home",
    list: "List",
    history: "History",
  },

  common: {
    cancel: "Cancel",
    delete: "Delete",
    error: "Error",
    ok: "OK",
  },

  history: {
    screenTitle: "History",
    title: "List History",

    savedLists_one: "{{count}} saved list",
    savedLists_other: "{{count}} saved lists",

    recordSummary: "{{units}} units · {{products}} products",

    recordDates: "Started on {{started}} · Closed on {{closed}}",

    noDescription: "NO DESCRIPTION",

    empty:
      "There are no saved lists yet. Lists are saved when you tap “Finished” or “Delete list”.",

    buttons: {
      reopen: "Reopen list",
      delete: "Delete",
      clearAll: "Clear all history",
      viewList: "View list",
    },

    alerts: {
      clearTitle: "Clear history",

      clearMessage:
        "All saved lists in your history will be deleted. Your current list and registered products will not be affected. Do you want to continue?",

      reopenedTitle: "List reopened",

      reopenedMessage:
        "It is now in the List tab. When you finish it again, it will return to the history.",

      reopenTitle: "Reopen list",

      reopenMessage:
        "This list will become your current list with its quantities, and will be removed from history until you finish it again.",

      listAlreadyOpenTitle: "You already have a list in progress",

      listAlreadyOpenMessage:
        "Finish or delete your current list from the List tab before reopening another one.",

      deleteRecordTitle: "Delete list from history",

      deleteRecordMessage:
        "The list from {{date}} will be deleted ({{units}} units of {{products}} products). Other lists, your current list, and registered products will not be affected. This action cannot be undone.",
    },

    errors: {
      load: "Could not load history.",
      clear: "Could not clear history.",
      reopen: "Could not reopen the list.",
      delete: "Could not delete the list from history.",

      loadConsole: "Error loading history:",
      clearConsole: "Error clearing history:",
      reopenConsole: "Error reopening the list:",
      deleteConsole: "Error deleting the list from history:",
    },
  },

  home: {
    user: "user",
    greeting: "Hello, {{name}}",
    admin: "ADMINISTRATOR",
    subtitle: "Scan your product to register it.",
    scanButton: "Scan QR",
    scanButtonSubtitle: "Tap to start",
    registeredProducts: "Products registered in the database",
    productsSection: "Products in the database",
    searchPlaceholder: "Search product...",
    noDescription: "NO DESCRIPTION",
    draft: "DRAFT",
    noProductsFound: "No products found.",
    noProducts: "There are no registered products yet.",

    errors: {
      countProducts: "Error counting products:",
      logout: "Error logging out:",
      logoutMessage: "Could not log out. Please try again.",
    },
  },

  list: {
    title: "My list",

    startedAt: "Started on {{date}}",

    totalInList: "Total in list",
    differentProducts: "Different products",

    loading: "Loading...",
    noDescription: "NO DESCRIPTION",
    completeHint: "Tap to complete",

    thisProduct: "this product",

    empty: "You haven't scanned any codes yet. Scan from the home screen.",

    buttons: {
      remove: "Remove",
      finalize: "Finish",
      finalized: "Finished",
      deleteList: "Delete list",
    },

    alerts: {
      removeTitle: "Remove from list",

      removeMessage:
        "Remove {{label}} from your list? The product will remain registered in the database.",

      emptyTitle: "Empty list",

      emptyMessage: "You haven't scanned any codes yet.",

      finalizeTitle: "Finish list",

      finalizeMessage:
        "Your list ({{units}} units of {{products}} products) will be saved to history and cleared so you can start a new one. You can reopen it from history.",

      finalizedTitle: "List finished",

      finalizedMessage:
        "It has been saved to your history. You can now start a new one.",

      deleteTitle: "Delete list",

      deleteMessageWithItems:
        "A copy will be saved to your history and the list will be deleted from the database. Registered products will NOT be deleted.",

      deleteMessageEmpty:
        "The list will be deleted. Registered products will NOT be deleted.",
    },

    errors: {
      load: "Could not load the list.",
      decrement: "Could not decrease the quantity.",
      remove: "Could not remove the product from the list.",

      finalize:
        "Could not finish the list. If saving to history failed, the list was not deleted.",

      delete:
        "Could not delete the list. If saving to history failed, the list was not deleted.",

      productReadConsole: "Could not read the product:",

      loadConsole: "Error loading the list:",
    },
  },

  productDetail: {
    loading: "Loading product...",
    productNumber: "Product number",
    quantityRead: "Quantity scanned",
    scanAgain: "Scan again",
  },

  changePassword: {
    title: "Change password",
    account: "Account",

    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Repeat new password",

    showPasswords: "Show passwords",
    hidePasswords: "Hide passwords",

    changeButton: "Change password",

    errors: {
      currentRequired: "Enter your current password.",

      minLength:
        "The new password must be at least {{length}} characters long.",

      samePassword: "The new password must be different from the current one.",

      notMatch: "The new passwords do not match.",

      changeConsole: "Error changing password:",
    },

    alerts: {
      successTitle: "Password updated",

      successMessage: "You can use your new password the next time you log in.",
    },
  },

  count: {
    title: "My list today",
    finalized: "FINISHED",

    totalInList: "Total in list",
    differentProducts: "Different products",

    loading: "Loading...",
    noDescription: "NO DESCRIPTION",
    completeDescription: "Tap to complete",

    noScansToday: "You haven't scanned any codes today.",

    productFallback: "this product",

    reopen: "Reopen list",
    finalizeButton: "Finish",
    deleteList: "Delete list",

    remove: {
      title: "Remove from list",

      message:
        "Remove {{product}} from your list? The product will remain registered in the database.",
    },

    empty: {
      title: "Empty list",

      message: "You haven't scanned any codes today.",
    },

    finalize: {
      title: "Finish list",

      message:
        "You are about to close your list with {{units}} units of {{products}} products. You won't be able to continue scanning until you reopen it.",

      confirm: "Finish",

      successTitle: "List finished",

      successMessage: "Your list has been saved.",
    },

    delete: {
      title: "Delete list",

      message:
        "Your entire list for today will be deleted from the database. Registered products will NOT be deleted. This action cannot be undone.",
    },

    errors: {
      readProduct: "Could not read the product:",

      loadList: "Could not load the list.",

      readStatus: "Error reading list status:",

      decrement: "Could not decrease the quantity.",

      removeProduct: "Could not remove the product from the list.",

      finalize: "Could not finish the list.",

      reopen: "Could not reopen the list.",

      deleteList: "Could not delete the list.",
    },
  },

  login: {
    email: "Email",
    password: "Password",

    loginButton: "Log in",
    loggingIn: "Logging in...",

    poweredBy: "Powered by Alejandro Sklar",

    alerts: {
      incompleteTitle: "Incomplete information",

      incompleteMessage: "Enter your email and password.",

      errorTitle: "Could not log in",

      errorMessage: "Check your email and password.",
    },
  },

  productForm: {
    title: "Product",

    productCode: "Scanned code",
    statusLabel: "Status",

    description: "Description",

    descriptionPlaceholder: "PRODUCT DESCRIPTION",

    adminOnly: "This section is for administrators only.",

    back: "Back",

    draftNotice:
      "This product has not been registered yet. Saving the description will register it.",

    status: {
      draft: "Not registered (draft)",
      registered: "Registered",
    },

    buttons: {
      save: "Save",
      edit: "Edit",
    },

    alerts: {
      missingDescriptionTitle: "Description missing",

      missingDescriptionMessage: "The description cannot be empty.",

      saveErrorTitle: "Could not save",

      savedTitle: "Saved",

      savedMessage: "The changes were saved successfully.",
    },

    errors: {
      notFound: "Product not found.",

      load: "Could not load the product.",

      save: "There was a problem saving the product.",

      loadConsole: "Error loading the product:",

      saveConsole: "Error saving the product:",
    },
  },

  scanResult: {
    newProduct: "Product registered",

    scanRegistered: "Scan registered",

    subtitle: "The product was added to the list and the quantity was updated.",

    productNumber: "Product number",

    quantity: "Quantity",

    scanAnother: "Scan another",

    viewProducts: "View product list",
  },

  scan: {
    permissionMessage: "We need access to the camera to scan QR codes.",

    grantPermission: "Grant permission",

    title: "Scanning code",

    instructions: {
      ready: "Point the camera at the barcode or QR code",
      starting: "Starting camera...",
    },

    viewList: "View my list",

    banner: {
      inList: "In your list: {{count}}",

      alreadyRegistered:
        "Already registered. Scan it again to add it to your list.",

      registered: "Registered. Scan it again to add it to your list.",

      cancelledTitle: "New product cancelled",

      cancelledSubtitle: "Not registered or added",
    },

    alerts: {
      finalizedTitle: "List finished",

      viewList: "View my list",

      close: "Close",

      retry: "Retry",

      missingDescriptionTitle: "Description missing",

      missingDescriptionMessage:
        "Enter the product description to register it.",

      registerErrorTitle: "Could not register",
    },

    errors: {
      processConsole: "Error processing code:",

      registerConsole: "Error registering product:",

      cameraConsole: "Error mounting camera:",

      permissionDenied:
        "Firestore rejected the operation. Check your session and rules.",

      process: "There was a problem processing the code.",

      register: "There was a problem and the product was not registered.",

      cameraStart: "Could not start the camera.",
    },

    newProductTitle: "✨ New product",

    newProductMessage:
      "This code is not registered. Enter the description to register it. Registering it does not add it to your list: scan it again afterward to count it.",

    productCode: "Scanned code",

    description: "Description",

    descriptionPlaceholder: "PRODUCT DESCRIPTION",

    register: "Register",
  },

  logo: {
    tagline: "Scan · Register · Control",
  },

  changePasswordService: {
    errors: {
      noSession: "There is no active session. Please log in again.",

      wrongPassword: "The current password is incorrect.",

      weakPassword: "The new password is too weak. Use at least 6 characters.",

      tooManyRequests: "Too many attempts. Wait a few minutes and try again.",

      network: "No connection. Check your internet connection and try again.",

      recentLogin: "For security, log out, log in again, and retry.",

      default: "Could not change the password. Please try again.",
    },
  },

  countService: {
    errors: {
      listNotEmpty: "There is already a list in progress.",

      clearPreviousStateConsole: "Could not clear the previous list state:",
    },
  },

  historyService: {
    errors: {
      noSession: "There is no active session.",
    },
  },

  productService: {
    errors: {
      emptyCode: "The code is empty.",

      noSession: "There is no active session.",

      emptyDescription: "Enter the product description.",

      descriptionRequired: "The product description is required.",

      permissionDenied: "You do not have permission to modify this product.",

      adminPermissionDenied:
        "Access denied. Administrator permissions are required to modify the product.",

      saveConsole: "Error saving the product:",

      loadConsole: "Error retrieving products:",
    },

    success: {
      productRegistered: "Product registered.",

      changesSaved: "Changes saved.",

      productUpdated: "Product updated successfully.",
    },
  },
};
