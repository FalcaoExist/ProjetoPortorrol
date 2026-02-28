import httpClient from "./validators/api/httpClient";

// LISTAR
export async function getSuppliers() {
  try {
    return await httpClient.get("/suppliers");
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return [];
  }
}

// CRIAR
export async function createSupplier(data) {
  try {
    return await httpClient.post("/suppliers", data);
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    throw error;
  }
}

// ATUALIZAR
export async function updateSupplier(id, data) {
  try {
    return await httpClient.put(`/suppliers/${id}`, data);
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    throw error;
  }
}

// DELETAR
export async function deleteSupplier(id) {
  try {
    return await httpClient.delete(`/suppliers/${id}`);
  } catch (error) {
    console.error("Erro ao deletar fornecedor:", error);
    throw error;
  }
}

// HISTÓRICO
export async function getSupplierHistory(id) {
  try {
    return await httpClient.get(`/suppliers/${id}/history`);
  } catch (error) {
    console.error("Erro ao buscar histórico do fornecedor:", error);
    return [];
  }
}