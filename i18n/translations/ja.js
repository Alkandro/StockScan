export default {
  tabs: {
    home: "ホーム",
    list: "リスト",
    history: "履歴",
  },

  common: {
    cancel: "キャンセル",
    delete: "削除",
    error: "エラー",
    ok: "OK",
  },

  history: {
    screenTitle: "履歴",
    title: "リスト履歴",

    savedLists_one: "{{count}} 件のリスト",
    savedLists_other: "{{count}} 件のリスト",

    recordSummary: "{{units}} 個 · {{products}} 商品",

    recordDates: "{{started}} に開始 · {{closed}} に終了",

    noDescription: "説明なし",

    empty:
      "保存されたリストはまだありません。「完了」または「リストを削除」をタップすると保存されます。",

    buttons: {
      reopen: "リストを再開",
      delete: "削除",
      clearAll: "履歴をすべて削除",
      viewList: "リストを見る",
    },

    alerts: {
      clearTitle: "履歴を削除",

      clearMessage:
        "履歴に保存されているすべてのリストを削除します。現在のリストと登録済みの商品には影響ありません。続行しますか？",

      reopenedTitle: "リストを再開しました",

      reopenedMessage:
        "リストタブに表示されています。もう一度完了すると履歴に戻ります。",

      reopenTitle: "リストを再開",

      reopenMessage:
        "このリストが現在のリストになり、数量も復元されます。再度完了するまで履歴から削除されます。",

      listAlreadyOpenTitle: "すでにリストが進行中です",

      listAlreadyOpenMessage:
        "別のリストを再開する前に、リストタブから現在のリストを完了または削除してください。",

      deleteRecordTitle: "履歴からリストを削除",

      deleteRecordMessage:
        "{{date}} のリスト（{{products}} 商品、{{units}} 個）を削除します。他のリスト、現在のリスト、登録済みの商品には影響ありません。この操作は元に戻せません。",
    },

    errors: {
      load: "履歴を読み込めませんでした。",
      clear: "履歴を削除できませんでした。",
      reopen: "リストを再開できませんでした。",
      delete: "履歴からリストを削除できませんでした。",

      loadConsole: "履歴の読み込みエラー:",
      clearConsole: "履歴の削除エラー:",
      reopenConsole: "リスト再開エラー:",
      deleteConsole: "履歴からのリスト削除エラー:",
    },
  },

  home: {
    user: "ユーザー",
    greeting: "こんにちは、{{name}}",
    admin: "管理者",
    subtitle: "商品をスキャンして登録します。",
    scanButton: "QRをスキャン",
    scanButtonSubtitle: "タップして開始",
    registeredProducts: "データベースに登録された商品",
    productsSection: "データベースの商品",
    searchPlaceholder: "商品を検索...",
    noDescription: "説明なし",
    draft: "下書き",
    noProductsFound: "商品が見つかりません。",
    noProducts: "登録された商品はまだありません。",

    errors: {
      countProducts: "商品の件数取得エラー:",
      logout: "ログアウトエラー:",
      logoutMessage: "ログアウトできませんでした。もう一度お試しください。",
    },
  },

  list: {
    title: "マイリスト",

    startedAt: "{{date}} に開始",

    totalInList: "リスト内の合計",
    differentProducts: "異なる商品数",

    loading: "読み込み中...",
    noDescription: "説明なし",
    completeHint: "タップして入力",

    thisProduct: "この商品",

    empty: "まだコードを読み取っていません。ホームからスキャンしてください。",

    buttons: {
      remove: "削除",
      finalize: "完了",
      finalized: "完了済み",
      deleteList: "リストを削除",
    },

    alerts: {
      removeTitle: "リストから削除",

      removeMessage:
        "{{label}} をリストから削除しますか？商品自体はデータベースに登録されたままです。",

      emptyTitle: "リストが空です",

      emptyMessage: "まだコードを読み取っていません。",

      finalizeTitle: "リストを完了",

      finalizeMessage:
        "{{products}} 商品、{{units}} 個のリストを履歴に保存し、新しいリストを開始できるようにします。履歴から再開することもできます。",

      finalizedTitle: "リストを完了しました",

      finalizedMessage: "履歴に保存されました。新しいリストを開始できます。",

      deleteTitle: "リストを削除",

      deleteMessageWithItems:
        "履歴にコピーを保存してから、データベースからリストを削除します。登録済みの商品は削除されません。",

      deleteMessageEmpty:
        "リストを削除します。登録済みの商品は削除されません。",
    },

    errors: {
      load: "リストを読み込めませんでした。",
      decrement: "数量を減らせませんでした。",
      remove: "リストから商品を削除できませんでした。",

      finalize:
        "リストを完了できませんでした。履歴への保存に失敗した場合、リストは削除されません。",

      delete:
        "リストを削除できませんでした。履歴への保存に失敗した場合、リストは削除されません。",

      productReadConsole: "商品の読み込みエラー:",

      loadConsole: "リストの読み込みエラー:",
    },
  },

  productDetail: {
    loading: "商品を読み込み中...",
    productNumber: "商品番号",
    quantityRead: "読み取った数量",
    scanAgain: "もう一度スキャン",
  },

  changePassword: {
    title: "パスワード変更",
    account: "アカウント",

    currentPassword: "現在のパスワード",
    newPassword: "新しいパスワード",
    confirmPassword: "新しいパスワードを再入力",

    showPasswords: "パスワードを表示",
    hidePasswords: "パスワードを非表示",

    changeButton: "パスワードを変更",

    errors: {
      currentRequired: "現在のパスワードを入力してください。",

      minLength: "新しいパスワードは {{length}} 文字以上である必要があります。",

      samePassword:
        "新しいパスワードは現在のパスワードと異なるものにしてください。",

      notMatch: "新しいパスワードが一致しません。",

      changeConsole: "パスワード変更エラー:",
    },

    alerts: {
      successTitle: "パスワードを更新しました",

      successMessage:
        "次回ログインするときから新しいパスワードを使用できます。",
    },
  },

  count: {
    title: "今日のマイリスト",
    finalized: "完了済み",

    totalInList: "リスト内の合計",
    differentProducts: "異なる商品数",

    loading: "読み込み中...",
    noDescription: "説明なし",
    completeDescription: "タップして入力",

    noScansToday: "今日はまだコードを読み取っていません。",

    productFallback: "この商品",

    reopen: "リストを再開",
    finalizeButton: "完了",
    deleteList: "リストを削除",

    remove: {
      title: "リストから削除",

      message:
        "{{product}} をリストから削除しますか？商品自体はデータベースに登録されたままです。",
    },

    empty: {
      title: "リストが空です",

      message: "今日はまだコードを読み取っていません。",
    },

    finalize: {
      title: "リストを完了",

      message:
        "{{products}} 商品、{{units}} 個のリストを完了します。再開するまでスキャンを続けることはできません。",

      confirm: "完了",

      successTitle: "リストを完了しました",

      successMessage: "リストが保存されました。",
    },

    delete: {
      title: "リストを削除",

      message:
        "今日のリスト全体をデータベースから削除します。登録済みの商品は削除されません。この操作は元に戻せません。",
    },

    errors: {
      readProduct: "商品の読み込みエラー:",

      loadList: "リストを読み込めませんでした。",

      readStatus: "リスト状態の読み込みエラー:",

      decrement: "数量を減らせませんでした。",

      removeProduct: "リストから商品を削除できませんでした。",

      finalize: "リストを完了できませんでした。",

      reopen: "リストを再開できませんでした。",

      deleteList: "リストを削除できませんでした。",
    },
  },

  login: {
    email: "メールアドレス",
    password: "パスワード",

    loginButton: "ログイン",
    loggingIn: "ログイン中...",

    poweredBy: "Powered by Alejandro Sklar",

    alerts: {
      incompleteTitle: "入力不足",

      incompleteMessage: "メールアドレスとパスワードを入力してください。",

      errorTitle: "ログインできませんでした",

      errorMessage: "メールアドレスとパスワードを確認してください。",
    },
  },

  productForm: {
    title: "商品",

    productCode: "読み取ったコード",
    statusLabel: "状態",

    description: "説明",

    descriptionPlaceholder: "商品説明",

    adminOnly: "このセクションは管理者専用です。",

    back: "戻る",

    draftNotice:
      "この商品はまだ登録されていません。説明を保存すると登録されます。",

    status: {
      draft: "未登録（下書き）",
      registered: "登録済み",
    },

    buttons: {
      save: "保存",
      edit: "変更",
    },

    alerts: {
      missingDescriptionTitle: "説明がありません",

      missingDescriptionMessage: "説明を空欄にすることはできません。",

      saveErrorTitle: "保存できませんでした",

      savedTitle: "保存完了",

      savedMessage: "変更内容を正常に保存しました。",
    },

    errors: {
      notFound: "商品が見つかりません。",

      load: "商品を読み込めませんでした。",

      save: "商品を保存中に問題が発生しました。",

      loadConsole: "商品の読み込みエラー:",

      saveConsole: "商品の保存エラー:",
    },
  },

  scanResult: {
    newProduct: "商品を登録しました",

    scanRegistered: "読み取りを登録しました",

    subtitle: "商品がリストに追加され、数量が更新されました。",

    productNumber: "商品番号",

    quantity: "数量",

    scanAnother: "別の商品をスキャン",

    viewProducts: "商品リストを見る",
  },

  scan: {
    permissionMessage:
      "QRコードをスキャンするにはカメラへのアクセスが必要です。",

    grantPermission: "許可する",

    title: "コードをスキャン中",

    instructions: {
      ready: "バーコードまたはQRコードにカメラを向けてください",
      starting: "カメラを起動中...",
    },

    viewList: "マイリストを見る",

    banner: {
      inList: "リスト内: {{count}}",

      alreadyRegistered:
        "すでに登録されています。もう一度スキャンしてリストに追加してください。",

      registered:
        "登録されました。もう一度スキャンしてリストに追加してください。",

      cancelledTitle: "新しい商品の登録をキャンセルしました",

      cancelledSubtitle: "登録も追加もされていません",
    },

    alerts: {
      finalizedTitle: "リストは完了済みです",

      viewList: "マイリストを見る",

      close: "閉じる",

      retry: "再試行",

      missingDescriptionTitle: "説明がありません",

      missingDescriptionMessage: "商品を登録するには説明を入力してください。",

      registerErrorTitle: "登録できませんでした",
    },

    errors: {
      processConsole: "コード処理エラー:",

      registerConsole: "商品登録エラー:",

      cameraConsole: "カメラの起動エラー:",

      permissionDenied:
        "Firestore によって操作が拒否されました。セッションとルールを確認してください。",

      process: "コードの処理中に問題が発生しました。",

      register: "問題が発生したため、商品を登録できませんでした。",

      cameraStart: "カメラを起動できませんでした。",
    },

    newProductTitle: "✨ 新しい商品",

    newProductMessage:
      "このコードは登録されていません。登録するには商品説明を入力してください。登録しただけではリストには追加されません。数量をカウントするには、もう一度スキャンしてください。",

    productCode: "読み取ったコード",

    description: "説明",

    descriptionPlaceholder: "商品説明",

    register: "登録",
  },

  logo: {
    tagline: "スキャン · 登録 · 管理",
  },

  changePasswordService: {
    errors: {
      noSession:
        "アクティブなセッションがありません。もう一度ログインしてください。",

      wrongPassword: "現在のパスワードが正しくありません。",

      weakPassword:
        "新しいパスワードが弱すぎます。6文字以上を使用してください。",

      tooManyRequests:
        "試行回数が多すぎます。数分待ってからもう一度お試しください。",

      network:
        "接続できません。インターネット接続を確認して、もう一度お試しください。",

      recentLogin:
        "セキュリティのため、一度ログアウトして再度ログインしてからお試しください。",

      default: "パスワードを変更できませんでした。もう一度お試しください。",
    },
  },

  countService: {
    errors: {
      listNotEmpty: "すでに進行中のリストがあります。",

      clearPreviousStateConsole: "以前のリスト状態をクリアできませんでした:",
    },
  },

  historyService: {
    errors: {
      noSession: "アクティブなセッションがありません。",
    },
  },

  productService: {
    errors: {
      emptyCode: "コードが空です。",

      noSession: "アクティブなセッションがありません。",

      emptyDescription: "商品の説明を入力してください。",

      descriptionRequired: "商品説明は必須です。",

      permissionDenied: "この商品を変更する権限がありません。",

      adminPermissionDenied:
        "アクセスが拒否されました。商品を変更するには管理者権限が必要です。",

      saveConsole: "商品の保存エラー:",

      loadConsole: "商品の取得エラー:",
    },

    success: {
      productRegistered: "商品を登録しました。",

      changesSaved: "変更を保存しました。",

      productUpdated: "商品を正常に更新しました。",
    },
  },
};
