import io
import pandas as pd
from app.audit.audit_actions import AuditAction
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.repositories.import_repository import ImportRepository

def process_background(file_contents: bytes, filename: str, user_id: str, user_repo: SupabaseUserRepository):
    import_repo = ImportRepository()
    try:
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(file_contents), sep=',', encoding='utf-8')
            except:
                df = pd.read_csv(io.BytesIO(file_contents), sep=';', encoding='latin-1')
        else:
            df = pd.read_excel(io.BytesIO(file_contents))

        if df.empty or len(df.columns) < 2:            
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
        
        for line_number, (_, row) in enumerate(df.iterrows(), start=2):
            try:
                if row.isna().all():
                    continue

                sku_id = import_repo.save_sku(row)
                if not sku_id:
                    errors += 1
                    continue

                import_repo.save_analysis(row, sku_id)
                import_repo.save_history(row, sku_id)
                success += 1

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