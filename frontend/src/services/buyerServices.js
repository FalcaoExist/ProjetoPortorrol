import httpClient from "./validators/api/httpClient";
import { logger } from "../utils/logger";

export async function checkEmailApi(email) {
  try {
    const response = await httpClient.get(`/check-email?email=${encodeURIComponent(email)}`);
    return response;
  } catch (err) {
    // Não loga por padrão aqui, mas mantém comportamento
    return { exists: false };
  }
}

/**
 * Salva o comprador no Supabase
 * Rota: POST /users
 */
export async function createBuyerApi(formData) {
  try {
    const payload = {
      name: formData.nome,
      email: formData.email,
      password: formData.senha,
      role: "comprador",
      supplier: formData.supplier || [] 
    };

    // CORRETO: Agora bate direto em /users
    const response = await httpClient.post("/users", payload);
    
    return { success: true, data: response };

  } catch (err) {
    logger.error("Erro ao criar comprador:", err);
    
    // Tratamento de erros
    // Tenta pegar a mensagem de erro detalhada do backend
    const errorMsg = err.data?.detail || err.message || "";

    if (err.status === 400 && (errorMsg.includes("já cadastrado") || errorMsg.includes("exists"))) {
      return { 
        success: false, 
        code: "EMAIL_EXISTS", 
        message: "Este e-mail já está em uso." 
      };
    }

    return { 
      success: false, 
      message: errorMsg || "Erro ao salvar no banco de dados." 
    };
  }
}