import { useState, useEffect, useMemo, useCallback } from "react";
import { useRowEditing } from "./useRowEditing";

export function useUsersTableLogic({ users, availableSuppliers, onUpdate }) {
    const [rows, setRows] = useState([]);
    
    // Hook de edição de linha
    const { rowModesModel, setRowModesModel, handleEditClick, handleSaveClick, handleCancelClick } = useRowEditing();

    // Sincroniza dados
    useEffect(() => {
        const mappedUsers = users.map(u => ({ 
            ...u, 
            id: u.user_id, 
            active: u.is_active ? "Ativo" : "Inativo"
        }));
        setRows(mappedUsers);
    }, [users]);

    // Filtros e Popover
    const [filters, setFilters] = useState({ name: "", email: "", supplier: [], active: "" });
    const [popoverState, setPopoverState] = useState({ anchorEl: null, columnId: null });

    const handleHeaderClick = useCallback((event, columnId) => {
        setPopoverState({ anchorEl: event.currentTarget, columnId });
    }, []);

    const handlePopoverClose = useCallback(() => {
        setPopoverState({ anchorEl: null, columnId: null });
    }, []);

    const handleFilterChange = useCallback((columnId, value) => {
        setFilters((previous) => ({ ...previous, [columnId]: value }));
    }, []);

    // Opções de fornecedores
    const supplierOptions = useMemo(() => {
        if (availableSuppliers.length > 0) return availableSuppliers; 
        return ["Timken", "NSK", "SKF", "Fag", "Schaeffler"];
    }, [availableSuppliers]);

    // Filtragem Local
    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const matchesName = !filters.name || row.name?.toLowerCase().includes(filters.name.toLowerCase());
            const matchesEmail = !filters.email || row.email?.toLowerCase().includes(filters.email.toLowerCase());
            
            let matchesSupplier = true;
            if (filters.supplier && filters.supplier.length > 0) {
                const rowSuppliers = Array.isArray(row.supplier) ? row.supplier : [];
                matchesSupplier = rowSuppliers.some(s => filters.supplier.includes(s));
            }
            
            const matchesActive = !filters.active || row.active === filters.active;
            return matchesName && matchesEmail && matchesSupplier && matchesActive;
        });
    }, [rows, filters]);

    // Update
    const processRowUpdate = async (newRow) => {
        try {
            let supplierPayload = newRow.supplier;
            if (typeof supplierPayload === 'string') supplierPayload = [supplierPayload];
            else if (!supplierPayload) supplierPayload = [];

            const updatedData = {
                name: newRow.name,
                email: newRow.email,
                is_active: newRow.active === "Ativo",
                supplier: supplierPayload 
            };
            
            const result = await onUpdate(newRow.id, updatedData);
            return { ...newRow, ...result, active: result.is_active ? "Ativo" : "Inativo" };
        } catch (error) {
            return Promise.reject(error);
        }
    };

    return {
        filteredRows,
        rowModesModel,
        setRowModesModel,
        popoverState,
        filters,
        supplierOptions,
        handleHeaderClick,
        handlePopoverClose,
        handleFilterChange,
        processRowUpdate,
        handleEditClick,
        handleSaveClick,
        handleCancelClick
    };
}