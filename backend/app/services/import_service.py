import io
import logging
import pandas as pd
from app.audit.audit_actions import AuditAction
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.repositories.import_repository import ImportRepository

logger = logging.getLogger(__name__)

def process_background(file_contents: bytes, filename: str, user_id: str, user_repo: SupabaseUserRepository):

    import_repo = ImportRepository()

    logger.info(
        "Iniciando importação de estoque - usuário: %s - arquivo: %s",
        user_id,
        filename,
    )

    try:
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(file_contents), sep=',', encoding='utf-8')
            except Exception as e:
                logger.debug("Falha ao ler CSV com UTF-8, tentando latin-1")
                df = pd.read_csv(io.BytesIO(file_contents), sep=';', encoding='latin-1')
        else:
            df = pd.read_excel(io.BytesIO(file_contents))

        if df.empty or len(df.columns) < 2:
            logger.warning(
                "Arquivo inválido na importação - usuário: %s - arquivo: %s",
                user_id,
                filename,
            )

            try:
                user_repo.insert_audit_log(
                    performed_by=user_id,
                    action=AuditAction.IMPORT_FILE_FAILURE,
                    entity="import",
                    entity_id=filename,
                    extra={"reason": "Arquivo vazio ou colunas insuficientes"}
                )
            except Exception as e:
                logger.exception(
                    "Falha ao registrar auditoria de arquivo inválido"
                )
                raise RuntimeError(
                    "Falha ao registrar auditoria de arquivo inválido"
                ) from e
            
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

                logger.error(
                    "Erro na linha %s da importação - usuário: %s - erro: %s",
                    line_number,
                    user_id,
                    str(e),
                )

                try:
                    user_repo.insert_audit_log(
                        performed_by=user_id,
                        action=AuditAction.IMPORT_ROW_FAILURE,
                        entity="import",
                        entity_id=str(line_number),
                        extra={"reason": str(e)}
                    )
                except Exception as audit_error:
                    logger.exception(
                        "Falha ao registrar auditoria de erro por linha"
                    )
                    raise RuntimeError(
                        "Falha ao registrar auditoria de erro por linha"
                    ) from audit_error
        
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
                extra={
                    "processed": success,
                    "errors": errors
                }
            )
        except Exception as e:
            logger.exception(
                "Falha ao registrar auditoria de sucesso da importação"
            )
            raise RuntimeError(
                "Falha ao registrar auditoria de sucesso da importação"
            ) from e

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
        except Exception as e:
            logger.exception(
                "Falha ao registrar auditoria de erro crítico"
            )
            raise RuntimeError(
                "Falha ao registrar auditoria de erro crítico"
            ) from e
        
        raise