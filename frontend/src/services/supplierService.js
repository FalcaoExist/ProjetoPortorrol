import httpClient from "./validators/api/httpClient";
import { logger } from "../utils/logger";

export const DEFAULT_BRANCH_NAMES = ["Porto Alegre", "Joinville", "São Paulo"];

export function parseDateForGrid(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toDateOnlyString(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function mapSupplierToGrid(item = {}) {
  return {
    id: item.supplier_id ?? item.id,
    name: item.name,
    budget: item.budget ?? 0,
    leadtimes: item.leadtimes || [],
    start: parseDateForGrid(item.start),
    end: parseDateForGrid(item.end),
    is_active: item.is_active,
  };
}

export function mapSupplierHistoryRow(item = {}) {
  return {
    ...item,
    recordedAt: item.created_at,
    id: item.history_id,
  };
}

export function buildSupplierLeadtimeMap(
  branches = [],
  supplierLeadtimes = [],
  branchNames = DEFAULT_BRANCH_NAMES
) {
  const leadtimeMap = new Map(
    (supplierLeadtimes || []).map((leadtime) => [leadtime.branch_id, leadtime.leadtime])
  );

  const relevantBranches = (branches || []).filter((branch) =>
    branchNames.includes(branch.nome || branch.name)
  );

  const mappedLeadtimes = relevantBranches.reduce((accumulator, branch) => {
    const branchName = branch.nome || branch.name;
    accumulator[branchName] = leadtimeMap.has(branch.id) ? leadtimeMap.get(branch.id) : 0;
    return accumulator;
  }, {});

  branchNames.forEach((name) => {
    if (!Object.prototype.hasOwnProperty.call(mappedLeadtimes, name)) {
      mappedLeadtimes[name] = 0;
    }
  });

  return mappedLeadtimes;
}

export function buildSupplierLeadtimeRows(branches = [], supplierLeadtimes = []) {
  const leadtimeMap = new Map(
    (supplierLeadtimes || []).map((leadtime) => [leadtime.branch_id, leadtime.leadtime])
  );

  return (branches || []).map((branch) => ({
    id: branch.id,
    branch_id: branch.id,
    name: branch.nome || branch.name || branch.id,
    days: leadtimeMap.has(branch.id) ? leadtimeMap.get(branch.id) : 0,
  }));
}

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
    logger.error("Erro ao buscar histórico do fornecedor:", error);
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
    logger.error("Erro ao buscar fornecedor por id:", error);
    return null;
  }
}