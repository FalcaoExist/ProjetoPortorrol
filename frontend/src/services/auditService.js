import httpClient from "./validators/api/httpClient";

// [ATENÇÃO] A palavra 'export' é obrigatória aqui para funcionar com { getAuditLogs }
export async function getAuditLogs({ user_id, action, entity, from, to, limit = 200, offset = 0 } = {}) {
  const params = new URLSearchParams();
  
  if (user_id) params.append("user_id", user_id);
  if (action) params.append("action", action);
  if (entity) params.append("entity", entity);
  if (from) params.append("date_from", from);
  if (to) params.append("date_to", to);
  
  params.append("limit", limit);
  params.append("offset", offset);

  // Monta a query string
  const endpoint = `/audit-logs?${params.toString()}`;

  try {
      const data = await httpClient.get(endpoint);
      // Retorna a lista ou array vazio
      return data.logs || [];
  } catch (err) {
      console.error("Erro ao buscar audit logs:", err);
      return [];
  }
}