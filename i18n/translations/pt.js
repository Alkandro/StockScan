export default {
  tabs: {
    home: "Início",
    list: "Lista",
    history: "Histórico",
  },

  common: {
    cancel: "Cancelar",
    delete: "Excluir",
    error: "Erro",
    ok: "OK",
  },

  history: {
    screenTitle: "Histórico",
    title: "Histórico de listas",

    savedLists_one: "{{count}} lista salva",
    savedLists_other: "{{count}} listas salvas",

    recordSummary: "{{units}} unidades · {{products}} produtos",

    recordDates: "Iniciada em {{started}} · Encerrada em {{closed}}",

    noDescription: "SEM DESCRIÇÃO",

    empty:
      "Ainda não há listas salvas. Elas são salvas ao tocar em “Finalizado” ou “Excluir lista”.",

    buttons: {
      reopen: "Reabrir lista",
      delete: "Excluir",
      clearAll: "Apagar todo o histórico",
      viewList: "Ver lista",
    },

    alerts: {
      clearTitle: "Apagar histórico",

      clearMessage:
        "Todas as listas salvas no seu histórico serão excluídas. Sua lista atual e os produtos cadastrados não serão alterados. Deseja continuar?",

      reopenedTitle: "Lista reaberta",

      reopenedMessage:
        "Ela já está na aba Lista. Quando você finalizá-la novamente, ela voltará para o histórico.",

      reopenTitle: "Reabrir lista",

      reopenMessage:
        "Esta lista passará a ser sua lista atual, com suas quantidades, e será removida do histórico até que você a finalize novamente.",

      listAlreadyOpenTitle: "Você já tem uma lista em andamento",

      listAlreadyOpenMessage:
        "Finalize ou exclua a lista atual na aba Lista antes de reabrir outra.",

      deleteRecordTitle: "Excluir lista do histórico",

      deleteRecordMessage:
        "A lista de {{date}} será excluída ({{units}} unidades de {{products}} produtos). As outras listas, sua lista atual e os produtos cadastrados não serão alterados. Esta ação não pode ser desfeita.",
    },

    errors: {
      load: "Não foi possível carregar o histórico.",
      clear: "Não foi possível apagar o histórico.",
      reopen: "Não foi possível reabrir a lista.",
      delete: "Não foi possível excluir a lista do histórico.",

      loadConsole: "Erro ao carregar o histórico:",
      clearConsole: "Erro ao apagar o histórico:",
      reopenConsole: "Erro ao reabrir a lista:",
      deleteConsole: "Erro ao excluir a lista do histórico:",
    },
  },

  home: {
    user: "usuário",
    greeting: "Olá, {{name}}",
    admin: "ADMINISTRADOR",
    subtitle: "Escaneie seu produto para registrá-lo.",
    scanButton: "Escanear QR",
    scanButtonSubtitle: "Toque para começar",
    registeredProducts: "Produtos cadastrados no banco de dados",
    productsSection: "Produtos no banco de dados",
    searchPlaceholder: "Buscar produto...",
    noDescription: "SEM DESCRIÇÃO",
    draft: "RASCUNHO",
    noProductsFound: "Nenhum produto encontrado.",
    noProducts: "Ainda não há produtos cadastrados.",

    errors: {
      countProducts: "Erro ao contar produtos:",
      logout: "Erro ao sair:",
      logoutMessage: "Não foi possível sair. Tente novamente.",
    },
  },

  list: {
    title: "Minha lista",

    startedAt: "Iniciada em {{date}}",

    totalInList: "Total na lista",
    differentProducts: "Produtos diferentes",

    loading: "Carregando...",
    noDescription: "SEM DESCRIÇÃO",
    completeHint: "Toque para completar",

    thisProduct: "este produto",

    empty:
      "Você ainda não leu nenhum código. Escaneie a partir da tela inicial.",

    buttons: {
      remove: "Remover",
      finalize: "Finalizar",
      finalized: "Finalizado",
      deleteList: "Excluir lista",
    },

    alerts: {
      removeTitle: "Remover da lista",

      removeMessage:
        "Remover {{label}} da sua lista? O produto continuará cadastrado no banco de dados.",

      emptyTitle: "Lista vazia",

      emptyMessage: "Você ainda não leu nenhum código.",

      finalizeTitle: "Finalizar lista",

      finalizeMessage:
        "Sua lista será salva ({{units}} unidades de {{products}} produtos) no histórico e ficará vazia para você começar uma nova. Você poderá reabri-la pelo histórico.",

      finalizedTitle: "Lista finalizada",

      finalizedMessage:
        "Ela foi salva no seu histórico. Agora você pode começar uma nova.",

      deleteTitle: "Excluir lista",

      deleteMessageWithItems:
        "Uma cópia será salva no seu histórico e a lista será excluída do banco de dados. Os produtos cadastrados NÃO serão excluídos.",

      deleteMessageEmpty:
        "A lista será excluída. Os produtos cadastrados NÃO serão excluídos.",
    },

    errors: {
      load: "Não foi possível carregar a lista.",
      decrement: "Não foi possível diminuir a quantidade.",
      remove: "Não foi possível remover o produto da lista.",

      finalize:
        "Não foi possível finalizar a lista. Se o salvamento no histórico falhou, a lista não foi excluída.",

      delete:
        "Não foi possível excluir a lista. Se o salvamento no histórico falhou, a lista não foi excluída.",

      productReadConsole: "Não foi possível ler o produto:",

      loadConsole: "Erro ao carregar a lista:",
    },
  },

  productDetail: {
    loading: "Carregando produto...",
    productNumber: "Nº do produto",
    quantityRead: "Quantidade lida",
    scanAgain: "Escanear novamente",
  },

  changePassword: {
    title: "Alterar senha",
    account: "Conta",

    currentPassword: "Senha atual",
    newPassword: "Nova senha",
    confirmPassword: "Repetir nova senha",

    showPasswords: "Mostrar senhas",
    hidePasswords: "Ocultar senhas",

    changeButton: "Alterar senha",

    errors: {
      currentRequired: "Digite sua senha atual.",

      minLength: "A nova senha deve ter pelo menos {{length}} caracteres.",

      samePassword: "A nova senha deve ser diferente da atual.",

      notMatch: "As novas senhas não coincidem.",

      changeConsole: "Erro ao alterar a senha:",
    },

    alerts: {
      successTitle: "Senha atualizada",

      successMessage:
        "Você já pode usar sua nova senha na próxima vez que entrar.",
    },
  },

  count: {
    title: "Minha lista de hoje",
    finalized: "FINALIZADA",

    totalInList: "Total na lista",
    differentProducts: "Produtos diferentes",

    loading: "Carregando...",
    noDescription: "SEM DESCRIÇÃO",
    completeDescription: "Toque para completar",

    noScansToday: "Você ainda não leu nenhum código hoje.",

    productFallback: "este produto",

    reopen: "Reabrir lista",
    finalizeButton: "Finalizar",
    deleteList: "Excluir lista",

    remove: {
      title: "Remover da lista",

      message:
        "Remover {{product}} da sua lista? O produto continuará cadastrado no banco de dados.",
    },

    empty: {
      title: "Lista vazia",

      message: "Você ainda não leu nenhum código hoje.",
    },

    finalize: {
      title: "Finalizar lista",

      message:
        "Você vai fechar sua lista com {{units}} unidades de {{products}} produtos. Não poderá continuar escaneando até reabri-la.",

      confirm: "Finalizar",

      successTitle: "Lista finalizada",

      successMessage: "Sua lista foi salva.",
    },

    delete: {
      title: "Excluir lista",

      message:
        "Sua lista completa de hoje será excluída do banco de dados. Os produtos cadastrados NÃO serão excluídos. Esta ação não pode ser desfeita.",
    },

    errors: {
      readProduct: "Não foi possível ler o produto:",

      loadList: "Não foi possível carregar a lista.",

      readStatus: "Erro ao ler o estado da lista:",

      decrement: "Não foi possível diminuir a quantidade.",

      removeProduct: "Não foi possível remover o produto da lista.",

      finalize: "Não foi possível finalizar a lista.",

      reopen: "Não foi possível reabrir a lista.",

      deleteList: "Não foi possível excluir a lista.",
    },
  },

  login: {
    email: "E-mail",
    password: "Senha",

    loginButton: "Entrar",
    loggingIn: "Entrando...",

    poweredBy: "Powered by Alejandro Sklar",

    alerts: {
      incompleteTitle: "Dados incompletos",

      incompleteMessage: "Digite seu e-mail e sua senha.",

      errorTitle: "Não foi possível entrar",

      errorMessage: "Verifique o e-mail e a senha.",
    },
  },

  productForm: {
    title: "Produto",

    productCode: "Código lido",
    statusLabel: "Status",

    description: "Descrição",

    descriptionPlaceholder: "DESCRIÇÃO DO PRODUTO",

    adminOnly: "Esta seção é exclusiva para o administrador.",

    back: "Voltar",

    draftNotice:
      "Este produto ainda não foi cadastrado. Ao salvar a descrição, ele será cadastrado.",

    status: {
      draft: "Não cadastrado (rascunho)",
      registered: "Cadastrado",
    },

    buttons: {
      save: "Salvar",
      edit: "Modificar",
    },

    alerts: {
      missingDescriptionTitle: "Falta a descrição",

      missingDescriptionMessage: "A descrição não pode ficar vazia.",

      saveErrorTitle: "Não foi possível salvar",

      savedTitle: "Salvo",

      savedMessage: "As alterações foram salvas com sucesso.",
    },

    errors: {
      notFound: "Produto não encontrado.",

      load: "Não foi possível carregar o produto.",

      save: "Ocorreu um problema ao salvar o produto.",

      loadConsole: "Erro ao carregar o produto:",

      saveConsole: "Erro ao salvar o produto:",
    },
  },

  scanResult: {
    newProduct: "Produto cadastrado",

    scanRegistered: "Leitura registrada",

    subtitle: "O produto foi adicionado à lista e a quantidade foi atualizada.",

    productNumber: "Nº do produto",

    quantity: "Quantidade",

    scanAnother: "Escanear outro",

    viewProducts: "Ver lista de produtos",
  },

  scan: {
    permissionMessage:
      "Precisamos de acesso à câmera para escanear os códigos QR.",

    grantPermission: "Conceder permissão",

    title: "Escaneando código",

    instructions: {
      ready: "Aponte para o código de barras ou QR",
      starting: "Iniciando câmera...",
    },

    viewList: "Ver minha lista",

    banner: {
      inList: "Na sua lista: {{count}}",

      alreadyRegistered:
        "Já estava cadastrado. Escaneie novamente para adicioná-lo.",

      registered:
        "Cadastrado. Escaneie novamente para adicioná-lo à sua lista.",

      cancelledTitle: "Novo produto cancelado",

      cancelledSubtitle: "Não foi cadastrado nem adicionado",
    },

    alerts: {
      finalizedTitle: "Lista finalizada",

      viewList: "Ver minha lista",

      close: "Fechar",

      retry: "Tentar novamente",

      missingDescriptionTitle: "Falta a descrição",

      missingDescriptionMessage:
        "Digite a descrição do produto para poder cadastrá-lo.",

      registerErrorTitle: "Não foi possível cadastrar",
    },

    errors: {
      processConsole: "Erro ao processar o código:",

      registerConsole: "Erro ao cadastrar o produto:",

      cameraConsole: "Erro ao montar a câmera:",

      permissionDenied:
        "O Firestore rejeitou a operação. Verifique sua sessão e as regras.",

      process: "Ocorreu um problema ao processar o código.",

      register: "Ocorreu um problema e o produto não foi cadastrado.",

      cameraStart: "Não foi possível iniciar a câmera.",
    },

    newProductTitle: "✨ Novo produto",

    newProductMessage:
      "Este código não está cadastrado. Digite a descrição para cadastrá-lo. Cadastrá-lo não o adiciona à sua lista: depois escaneie novamente para contabilizá-lo.",

    productCode: "Código lido",

    description: "Descrição",

    descriptionPlaceholder: "DESCRIÇÃO DO PRODUTO",

    register: "Cadastrar",
  },

  logo: {
    tagline: "Escaneie · Registre · Controle",
  },

  changePasswordService: {
    errors: {
      noSession: "Não há uma sessão ativa. Entre novamente.",

      wrongPassword: "A senha atual está incorreta.",

      weakPassword: "A nova senha é muito fraca. Use pelo menos 6 caracteres.",

      tooManyRequests:
        "Muitas tentativas. Aguarde alguns minutos e tente novamente.",

      network: "Sem conexão. Verifique sua internet e tente novamente.",

      recentLogin:
        "Por segurança, saia da conta, entre novamente e tente outra vez.",

      default: "Não foi possível alterar a senha. Tente novamente.",
    },
  },

  countService: {
    errors: {
      listNotEmpty: "Já existe uma lista em andamento.",

      clearPreviousStateConsole:
        "Não foi possível limpar o estado anterior da lista:",
    },
  },

  historyService: {
    errors: {
      noSession: "Não há uma sessão ativa.",
    },
  },

  productService: {
    errors: {
      emptyCode: "O código está vazio.",

      noSession: "Não há uma sessão ativa.",

      emptyDescription: "Digite a descrição do produto.",

      descriptionRequired: "A descrição é obrigatória.",

      permissionDenied: "Você não tem permissão para modificar este produto.",

      adminPermissionDenied:
        "Acesso negado. É necessário ter permissões de Administrador para modificar o produto.",

      saveConsole: "Erro ao salvar o produto:",

      loadConsole: "Erro ao obter produtos:",
    },

    success: {
      productRegistered: "Produto cadastrado.",

      changesSaved: "Alterações salvas.",

      productUpdated: "Produto atualizado com sucesso.",
    },
  },
};
