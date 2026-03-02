from app.audit.audit_actions import AuditAction
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.repositories.import_repository import ImportRepository

def process_background(data_batch: list, filename: str, user_id: str):
    # Instanciamos os repositórios diretamente aqui
    user_repo = SupabaseUserRepository()
    import_repo = ImportRepository()
    
    try:
        if not data_batch or len(data_batch) < 1:            
            try:
                user_repo.insert_audit_log(
                    performed_by=user_id,
                    action=AuditAction.IMPORT_FILE_FAILURE,
                    entity="import",
                    entity_id=filename,
                    extra={"reason": "Arquivo vazio ou colunas insuficientes"}
                )
            except Exception as e:
                raise RuntimeError("Falha ao registrar auditoria de arquivo inválido") from e

            return

        success = 0
        errors = 0
        
        for line_number, row in enumerate(data_batch, start=2):
            try:
                sku_id = import_repo.save_sku(row)
                if sku_id:
                    import_repo.save_analysis(row, sku_id)
                    import_repo.save_history(row, sku_id)
                    success += 1
                else:
                    errors += 1
            except Exception as e:
                errors += 1
                try:
                    user_repo.insert_audit_log(
                        performed_by=user_id,
                        action=AuditAction.IMPORT_ROW_FAILURE,
                        entity="import",
                        entity_id=str(line_number),
                        extra={"reason": str(e)}
                    )
                except Exception as audit_error:
                    raise RuntimeError(
                        "Falha ao registrar auditoria de erro por linha"
                    ) from audit_error
        
        try:
            user_repo.insert_audit_log(
                performed_by=user_id,
                action=AuditAction.IMPORT_SUCCESS,
                entity="import",
                entity_id=filename,
                extra={
                    "processed": success,
                    "errors": errors
                }
            )
        except Exception as e:
            raise RuntimeError("Falha ao registrar auditoria de sucesso da importação") from e

    except Exception as e_critic:
        try:
            user_repo.insert_audit_log(
                performed_by=user_id,
                action=AuditAction.SYSTEM_ERROR,
                entity="import",
                entity_id=filename,
                extra={"error": str(e_critic)}
            )
        except Exception as e:
            raise RuntimeError("Falha ao registrar auditoria de erro crítico") from e
        
        raise