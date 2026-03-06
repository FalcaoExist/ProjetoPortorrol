from dataclasses import dataclass
from typing import Dict
from app.audit.audit_actions import AuditAction

@dataclass(frozen=True)
class AuditMessage:
    label: str
    description: str
    severity: str  # INFO | WARNING | ERROR | SUCCESS
    category: str  # AUTH | USER | SUPPLIER | ORDER | DEMAND | STOCK | IMPORT | SYSTEM

AUDIT_MESSAGES: Dict[AuditAction, AuditMessage] = {

    # ===== AUTH =====

    AuditAction.LOGIN_SUCCESS: AuditMessage(
        label="Login realizado",
        description="Usuário autenticado com sucesso",
        severity="INFO",
        category="AUTH",
    ),

    AuditAction.LOGIN_FAILURE: AuditMessage(
        label="Falha no login",
        description="Tentativa de login com credenciais inválidas",
        severity="WARNING",
        category="AUTH",
    ),

    AuditAction.LOGOUT: AuditMessage(
        label="Logout realizado",
        description="Usuário encerrou a sessão no sistema",
        severity="INFO",
        category="AUTH",
    ),

    # ===== USER =====

    AuditAction.USER_CREATE: AuditMessage(
        label="Usuário criado",
        description="Novo usuário cadastrado no sistema",
        severity="INFO",
        category="USER",
    ),

    AuditAction.USER_UPDATE: AuditMessage(
        label="Usuário atualizado",
        description="Dados do usuário foram alterados",
        severity="INFO",
        category="USER",
    ),

    AuditAction.USER_DELETE: AuditMessage(
        label="Usuário removido",
        description="Usuário excluído do sistema",
        severity="WARNING",
        category="USER",
    ),

    AuditAction.USER_PASSWORD_UPDATE: AuditMessage(
        label="Senha alterada",
        description="Senha do usuário foi atualizada",
        severity="WARNING",
        category="USER",
    ),

    # ===== SUPPLIER =====

    AuditAction.SUPPLIER_CREATE: AuditMessage(
        label="Fornecedor criado",
        description="Novo fornecedor cadastrado",
        severity="INFO",
        category="SUPPLIER",
    ),

    AuditAction.SUPPLIER_UPDATE: AuditMessage(
        label="Fornecedor atualizado",
        description="Dados do fornecedor foram modificados",
        severity="INFO",
        category="SUPPLIER",
    ),

    AuditAction.SUPPLIER_DELETE: AuditMessage(
        label="Fornecedor removido",
        description="Fornecedor foi excluído do sistema",
        severity="WARNING",
        category="SUPPLIER",
    ),

    # ===== ORDER =====

    AuditAction.ORDER_CREATE: AuditMessage(
        label="Pedido criado",
        description="Novo pedido registrado no sistema",
        severity="INFO",
        category="ORDER",
    ),

    AuditAction.ORDER_STATUS_CHANGE: AuditMessage(
        label="Status do pedido alterado",
        description="Status do pedido foi modificado",
        severity="WARNING",
        category="ORDER",
    ),

    # ===== DEMAND =====

    AuditAction.DEMAND_UPDATE: AuditMessage(
        label="Demanda atualizada",
        description="Demanda foi alterada manualmente",
        severity="INFO",
        category="DEMAND",
    ),

    # ===== IMPORT =====

    AuditAction.IMPORT_SUCCESS: AuditMessage(
        label="Importação concluída",
        description="Arquivo importado com sucesso",
        severity="INFO",
        category="IMPORT",
    ),

    AuditAction.IMPORT_FAILURE: AuditMessage(
        label="Falha na importação",
        description="Erro durante processamento do arquivo",
        severity="ERROR",
        category="IMPORT",
    ),

    AuditAction.IMPORT_ROW_FAILURE: AuditMessage(
        label="Erro em linha da importação",
        description="Falha ao processar linha específica do arquivo",
        severity="WARNING",
        category="IMPORT",
    ),

    # ===== SYSTEM =====
    
    AuditAction.SYSTEM_ERROR: AuditMessage(
        label="Erro interno do sistema",
        description="Erro inesperado registrado pelo sistema",
        severity="ERROR",
        category="SYSTEM",
    ),
}