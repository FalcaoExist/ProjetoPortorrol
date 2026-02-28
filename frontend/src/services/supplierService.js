import httpClient from "./validators/api/httpClient";
import { logger } from "../utils/logger";

export async function getSuppliers() {
  try {
    const response = await httpClient.get("/suppliers");
    return response || [];
  } catch (error) {
    logger.error("Erro ao buscar fornecedores:", error);
    return [];
  }
}

export async function createSupplier(data) {
  try {
    const response = await httpClient.post("/suppliers", data);
    return response;
  } catch (error) {
    logger.error("Erro ao criar fornecedor:", error);
    throw error;
  }
}

export async function updateSupplier(id, data) {
  try {
    const response = await httpClient.put(`/suppliers/${id}`, data);
    return response;
  } catch (error) {
    logger.error("Erro ao atualizar fornecedor:", error);
    throw error;
  }
}

export async function deleteSupplier(id) {
  try {
    await httpClient.delete(`/suppliers/${id}`);
  } catch (error) {
    logger.error("Erro ao deletar fornecedor:", error);
    throw error;
  }
}