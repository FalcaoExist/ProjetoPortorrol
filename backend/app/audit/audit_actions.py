from enum import Enum

class AuditAction(str, Enum):
    LOGIN = "login"

    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    UPDATE_PASSWORD = "update_password"

    IMPORT_SUCCESS = "import_success"
    IMPORT_ERROR = "import_error"
    IMPORT_ROW_FAILURE = "import_row_failure"
    IMPORT_FILE_FAILURE = "import_file_failure"

    SYSTEM_ERROR = "system_error"