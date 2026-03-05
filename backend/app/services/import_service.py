import logging
from app.audit.audit_actions import AuditAction
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.repositories.import_repository import ImportRepository

logger = logging.getLogger(__name__)

def process_background(data_batch: list, filename: str, user_id: str):
    user_repo = SupabaseUserRepository()
    import_repo = ImportRepository()
    
    logger.info(
        "Iniciando importação de arquivo - usuário: %s - arquivo: %s",
        user_id,
        filename,
    )

    try:
        if not data_batch or len(data_batch) < 1:            
            logger.warning(
                "Arquivo vazio na importação - usuário: %s - arquivo: %s",
                user_id,
                filename,
            )
            try:
                user_repo.insert_audit_log(
                    performed_by=user_id,
                    action=AuditAction.IMPORT_FILE_FAILURE,
                    entity="import",
                    entity_id=filename,
                    extra={"reason": "Arquivo vazio"}
                )
            except Exception:
                logger.exception("Falha ao registrar auditoria de arquivo vazio")
            return

        success = 0
        errors = 0
        chunk_size = 250
        
        for i in range(0, len(data_batch), chunk_size):
            chunk = data_batch[i:i + chunk_size]
            try:
                processed_count = import_repo.process_batch(chunk)
                success += processed_count
            except Exception as e:
                errors += len(chunk)
                logger.error(
                    "Erro ao importar lote %s - usuário: %s - erro: %s",
                    i,
                    user_id,
                    str(e),
                )
                try:
                    user_repo.insert_audit_log(
                        performed_by=user_id,
                        action=AuditAction.IMPORT_ROW_FAILURE,
                        entity="import",
                        entity_id=f"{filename} (Lote {i})",
                        extra={"reason": str(e)}
                    )
                except Exception:
                    logger.exception("Falha ao registrar auditoria de erro do lote")
        
        logger.info(
            "Importação concluída - usuário: %s - arquivo: %s - sucesso: %d - erros: %d",
            user_id,
            filename,
            success,
            errors,
        )

        try:
            user_repo.insert_audit_log(
                performed_by=user_id,
                action=AuditAction.IMPORT_SUCCESS,
                entity="import",
                entity_id=filename,
                extra={"processed": success, "errors": errors}
            )
        except Exception:
            logger.exception("Falha ao registrar auditoria de sucesso da importação")

    except Exception as e_critic:
        logger.exception(
            "Erro crítico na importação - usuário: %s - arquivo: %s",
            user_id,
            filename,
        )
        try:
            user_repo.insert_audit_log(
                performed_by=user_id,
                action=AuditAction.SYSTEM_ERROR,
                entity="import",
                entity_id=filename,
                extra={"error": str(e_critic)}
            )
        except Exception:
            logger.exception("Falha ao registrar auditoria de erro crítico")
        raise