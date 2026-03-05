import io
import logging
import pandas as pd
from app.audit.audit_actions import AuditAction
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.repositories.import_repository import ImportRepository

logger = logging.getLogger(__name__)

def process_background(file_contents: bytes, filename: str, user_id: str):
    user_repo = SupabaseUserRepository()
    import_repo = ImportRepository()

    logger.info(f"Iniciando importação de arquivo - usuário: {user_id} - arquivo: {filename}")

    try:
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(file_contents), sep=',', encoding='utf-8')
            except Exception as e:
                logger.debug(f"Falha ao ler CSV com UTF-8, tentando latin-1: {e}")
                df = pd.read_csv(io.BytesIO(file_contents), sep=';', encoding='latin-1')
        else:
            df = pd.read_excel(io.BytesIO(file_contents))

        if df.empty or len(df.columns) < 2:
            logger.warning(f"Arquivo vazio ou inválido na importação - usuário: {user_id} - arquivo: {filename}")
            try:
                user_repo.insert_audit_log(
                    performed_by=user_id,
                    action=AuditAction.IMPORT_FILE_FAILURE,
                    entity="import",
                    entity_id=filename,
                    extra={"reason": "Arquivo vazio ou colunas insuficientes"}
                )
            except Exception as e:
                logger.exception("Falha ao registrar auditoria de arquivo inválido")
                raise RuntimeError("Falha ao registrar auditoria de arquivo inválido") from e
            return

        data_batch = df.to_dict('records')
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
                logger.error(f"Erro ao importar lote {i} - usuário: {user_id} - erro: {e}")
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

        logger.info(f"Importação concluída - usuário: {user_id} - arquivo: {filename} - sucesso: {success} - erros: {errors}")

        try:
            user_repo.insert_audit_log(
                performed_by=user_id,
                action=AuditAction.IMPORT_SUCCESS,
                entity="import",
                entity_id=filename,
                extra={"processed": success, "errors": errors}
            )
        except Exception as e:
            logger.exception("Falha ao registrar auditoria de sucesso da importação")
            raise RuntimeError("Falha ao registrar auditoria de sucesso da importação") from e

    except Exception as e_critic:
        logger.exception(f"Erro crítico na importação - usuário: {user_id} - arquivo: {filename}")
        try:
            user_repo.insert_audit_log(
                performed_by=user_id,
                action=AuditAction.SYSTEM_ERROR,
                entity="import",
                entity_id=filename,
                extra={"error": str(e_critic)}
            )
        except Exception as e:
            logger.exception("Falha ao registrar auditoria de erro crítico")
            raise RuntimeError("Falha ao registrar auditoria de erro crítico") from e
        raise e_critic