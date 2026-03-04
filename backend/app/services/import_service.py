from app.audit.audit_actions import AuditAction
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.repositories.import_repository import ImportRepository

def process_background(data_batch: list, filename: str, user_id: str):
    user_repo = SupabaseUserRepository()
    import_repo = ImportRepository()
    
    try:
        if not data_batch or len(data_batch) < 1:            
            user_repo.insert_audit_log(
                performed_by=user_id,
                action=AuditAction.IMPORT_FILE_FAILURE,
                entity="import",
                entity_id=filename,
                extra={"reason": "Arquivo vazio"}
            )
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
                user_repo.insert_audit_log(
                    performed_by=user_id,
                    action=AuditAction.IMPORT_ROW_FAILURE,
                    entity="import",
                    entity_id=f"{filename} (Lote {i})",
                    extra={"reason": str(e)}
                )
        
        user_repo.insert_audit_log(
            performed_by=user_id,
            action=AuditAction.IMPORT_SUCCESS,
            entity="import",
            entity_id=filename,
            extra={"processed": success, "errors": errors}
        )

    except Exception as e_critic:
        user_repo.insert_audit_log(
            performed_by=user_id,
            action=AuditAction.SYSTEM_ERROR,
            entity="import",
            entity_id=filename,
            extra={"error": str(e_critic)}
        )
        raise