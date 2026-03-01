import httpClient from "./validators/api/httpClient";
import { logger } from "../utils/logger";

// LISTAR
export async function getSuppliers() {
  try {
    return await httpClient.get("/suppliers");
  } catch (error) {
    logger.error("Erro ao buscar fornecedores:", error);
    return [];
  }
}

// CRIAR
export async function createSupplier(data) {
  try {
    return await httpClient.post("/suppliers", data);
  } catch (error) {
    logger.error("Erro ao criar fornecedor:", error);
    throw error;
  }
}

// ATUALIZAR
export async function updateSupplier(id, data) {
  try {
    return await httpClient.put(`/suppliers/${id}`, data);
  } catch (error) {
    logger.error("Erro ao atualizar fornecedor:", error);
    throw error;
  }
}

// DELETAR
export async function deleteSupplier(id) {
  try {
    return await httpClient.delete(`/suppliers/${id}`);
  } catch (error) {
    logger.error("Erro ao deletar fornecedor:", error);
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

// BUSCAR FORNECEDOR POR ID (usa query param supplier_id na rota /suppliers)
export async function getSupplierById(id) {
  try {
    const response = await httpClient.get(`/suppliers?supplier_id=${id}`);
    // endpoint retorna array (possivelmente vazio) — retornamos o primeiro elemento
    return (response && response[0]) || null;
  } catch (error) {
    console.error("Erro ao buscar fornecedor por id:", error);
    return null;
  }
}