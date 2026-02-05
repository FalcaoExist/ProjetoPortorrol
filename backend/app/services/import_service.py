import io
import pandas as pd
from app.repositories.import_repository import (log_error, log_global, save_analysis, save_history, save_sku)
from app.audit.audit_actions import AuditAction
from app.repositories.repositories_supabase import SupabaseUserRepository

def process_background(file_contents: bytes, filename: str, user_id: str):
    """
    Esta função roda 'sozinha' após o servidor responder ao usuário.
    """
    
    user_repo = SupabaseUserRepository()

    try:
        # 1. Transformar Bytes em DataFrame (Pandas)
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(file_contents), sep=',', encoding='utf-8')
            except:
                df = pd.read_csv(io.BytesIO(file_contents), sep=';', encoding='latin-1')
        else:
            df = pd.read_excel(io.BytesIO(file_contents))

        # 2. Validações
        if df.empty or len(df.columns) < 2:
            log_global(filename, "Arquivo vazio ou colunas insuficientes", user_id)
            
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

        # 3. Loop de Processamento (Sua lógica original)
        success = 0
        errors = 0
        
        for index, row in df.iterrows():
            try:
                if row.isna().all():
                    continue
                sku_id = save_sku(row)
                if not sku_id:
                    continue
                save_analysis(row, sku_id)
                save_history(row, sku_id)
                success += 1

            except Exception as e:
                errors += 1
                log_error(
                    line=index + 2,
                    reason=str(e),
                    row_data=row
                )

                try:
                    user_repo.insert_audit_log(
                        performed_by=user_id,
                        action=AuditAction.IMPORT_ROW_FAILURE,
                        entity="import",
                        entity_id=str(index + 2),
                        extra={"reason": str(e)}
                    )
                except Exception as audit_error:
                    log_error(
                        line=index + 2,
                        reason=f"Falha ao registrar auditoria: {audit_error}",
                        row_data=row
                    )

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
        log_global(filename, f"Erro Fatal: {str(e_critic)}")

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