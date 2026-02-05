AUDIT_MESSAGES = {
    "login": {
        "label": "Login",
        "severity": "INFO",
        "default_description": "Usuário realizou login no sistema."
    },

    "create_user": {
        "label": "Criação de usuário",
        "severity": "INFO",
        "default_description": "Usuário criado com sucesso."
    },

    "update_user": {
        "label": "Atualização de usuário",
        "severity": "INFO",
        "default_description": "Usuário atualizado com sucesso."
    },

    "delete_user": {
        "label": "Exclusão de usuário",
        "severity": "WARNING",
        "default_description": "Usuário excluído com sucesso."
    },

    # LEGADO - manter para logs antigos - revisar depois de limpeza das rotas
    "insert": {
        "label": "Criação de registro",
        "severity": "INFO",
    },

    "delete": {
        "label": "Exclusão de registro",
        "severity": "WARNING",
        "default_description": "Registro excluído com sucesso."
    },

    "import_error": {
        "label": "Erro de importação",
        "severity": "ERROR",
    },

    "import_row_failure": {
        "label": "Erro em linha importada",
        "severity": "ERROR",
    },

    "import_file_failure": {
        "label": "Erro no arquivo importado",
        "severity": "ERROR",
        "default_description": "Erro ao importar arquivo."
    },

    "import_success": {
        "label": "Importação concluída",
        "severity": "INFO",
        "default_description": "Arquivo importado com sucesso."
    },

    "system_error": {
        "label": "Erro do sistema",
        "severity": "ERROR",
        "default_description": "Ocorreu um erro inesperado no sistema."
    },

    "update_password": {
        "label": "Alteração de senha",
        "severity": "INFO",
        "default_description": "Senha do usuário alterada."
    },
}