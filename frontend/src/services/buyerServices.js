import httpClient from "./validators/api/httpClient";

/**
 * Verifica se o e-mail já existe no Supabase
 * Rota: GET /api/check-email?email=...
 */
export async function checkEmailApi(email) {
  try {
    // O backend deve retornar { exists: true/false }
    const response = await httpClient.get(`/api/check-email?email=${encodeURIComponent(email)}`);
    return response;
  } catch (err) {
    console.error("Erro ao verificar e-mail:", err);
    // Em caso de erro, assumimos false para não bloquear o usuário, mas logamos
    return { exists: false };
  }
}

/**
 * Salva o comprador no Supabase
 * Rota: POST /api/users
 */
export async function createBuyerApi(formData) {
  try {
    // Adapta o objeto do formulário para o que o Backend (Pydantic) espera
    const payload = {
      name: formData.nome,
      email: formData.email,
      password: formData.senha,
      role: "comprador", // Forçamos o perfil
      supplier: formData.supplier || [] // Garante que é um array
    };

    const response = await httpClient.post("/api/users", payload);
    
    // O httpClient já trata o .json(). Se chegou aqui, é sucesso.
    return { success: true, data: response };

  } catch (err) {
    console.error("Erro ao criar comprador:", err);
    
    // Tratamento de erros específicos do Backend
    if (err.status === 400 && err.message?.includes("já cadastrado")) {
      return { 
        success: false, 
        code: "EMAIL_EXISTS", 
        message: "Este e-mail já está em uso." 
      };
    }

    return { 
      success: false, 
      message: err.message || "Erro ao salvar no banco de dados." 
    };
  }
}