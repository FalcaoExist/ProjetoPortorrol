import httpClient from "./validators/api/httpClient";
import { logger } from "../utils/logger";

export async function getAuditLogs({
  user_id,
  action,
  entity,
  from,
  to,
  limit = 200,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();

  if (user_id) params.append("user_id", user_id);
  if (action) params.append("action", action);
  if (entity) params.append("entity", entity);
  if (from) params.append("date_from", from);
  if (to) params.append("date_to", to);

  params.append("limit", limit);
  params.append("offset", offset);

  const endpoint = `/audit-logs?${params.toString()}`;

  try {
    const rows = await httpClient.get(endpoint);

    if (!Array.isArray(rows)) return [];

    return rows.map((row) => ({
      id: row.log_id,                
      user: row.user_name,
      timestamp: row.created_at,
      action_label: row.action_label,
      severity: row.severity,
      description: row.description,
    }));
  } catch (err) {
    logger.error("Erro ao buscar audit logs:", err);
    return [];
  }
}