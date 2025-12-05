import httpClient from "./validators/api/httpClient";

/**
 * Busca a lista de todos os fornecedores cadastrados.
 * Rota esperada: GET /suppliers
 */
export async function getSuppliers() {
  try {
    const response = await httpClient.get("/suppliers");
    
    // O backend agora retorna uma lista direta de strings: ["Timken", "NSK"]
    // Ou uma lista de objetos se não tiver sido achatada. 
    // O httpClient já trata o .json().
    return response || [];
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return [];
  }
}