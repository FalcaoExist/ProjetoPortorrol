import React, { useMemo } from 'react';
import { BaseDataGrid } from '../common/BaseDataGrid';
import { IconButton } from '@mui/material';
import { FaTrash } from 'react-icons/fa';

const filialOptions = ["Porto Alegre", "Joinville", "São Paulo"];

export default function NewOrderTable({ 
    rows = [], 
    handleRowUpdate, 
    handleDelete, 
    supplierOptions = [] 
}) {

    const processRowUpdate = async (newRow, oldRow) => {
        const updatedRow = await handleRowUpdate(newRow);
        return updatedRow ?? oldRow;
    };

    const columns = useMemo(() => [
        {
            field: 'actions',
            headerName: '',
            minWidth: 50,
            flex: 0.2,
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            renderCell: (params) => (
                <IconButton onClick={() => handleDelete(params.id)} size="small">
                    <FaTrash />
                </IconButton>
            ),
        },
        {
            field: "item",
            headerName: "Item",
            minWidth: 180,
            flex: 1.5,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: "fornecedor",
            headerName: "Fornecedor",
            minWidth: 150,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
            editable: true,
            type: "singleSelect",
            valueOptions: supplierOptions,
        },
        {
            field: "unidades",
            headerName: "Unidades",
            type: "number",
            minWidth: 100,
            flex: 0.7,
            editable: true,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: "filial",
            headerName: "Filial",
            minWidth: 150,
            flex: 1,
            editable: true,
            type: "singleSelect",
            valueOptions: filialOptions,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => params.value ?? "",
        },
        
        // --- AQUI ESTÁ A CORREÇÃO DOS CENTAVOS ---
        {
            field: "valor",
            headerName: "Valor (R$)",
            type: "number",
            minWidth: 120,
            flex: 0.8,
            editable: true,
            align: "left",
            headerAlign: "left",

            // O segredo está aqui: Antes de salvar, troca vírgula por ponto
            valueParser: (value) => {
                if (value === "" || value == null) return null;
                
                // Converte para string, troca ',' por '.' e transforma em Float
                const stringValue = String(value).replace(',', '.');
                const numberValue = parseFloat(stringValue);

                return isNaN(numberValue) ? null : numberValue;
            },

            // Formata para mostrar R$ bonito na tabela
            renderCell: (params) => {
                if (params.value == null) return "";
                return params.value.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                });
            },
        },

        {
            field: "previsao_entrega",
            headerName: "Previsão de entrega",
            minWidth: 180,
            flex: 1,
            editable: true,
            align: "left",
            headerAlign: "left",

            renderCell: (params) => {
                if (!params.value) return "";
                const date = new Date(params.value);
                if (isNaN(date.getTime())) return "";
                const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                const correctedDate = new Date(date.getTime() + userTimezoneOffset);
                return correctedDate.toLocaleDateString("pt-BR");
            },

            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = async (e) => {
                    const newValue = e.target.value || null;
                    await api.setEditCellValue(
                        { id, field, value: newValue },
                        { debounceMs: 0 }
                    );
                };

                let formattedValue = value;
                if (value instanceof Date) {
                    formattedValue = value.toISOString().split("T")[0];
                } else if (typeof value === "string" && value.includes("T")) {
                    formattedValue = value.split("T")[0];
                }

                return (
                    <input
                        type="date"
                        value={formattedValue ?? ""}
                        onChange={handleChange}
                        className="w-full h-full bg-transparent outline-none border-none text-left p-2"
                    />
                );
            },
        },
    ], [handleDelete, supplierOptions]);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full">
                <BaseDataGrid
                    rows={rows}
                    columns={columns}
                    processRowUpdate={processRowUpdate}
                    onProcessRowUpdateError={(error) => console.error(error)}
                    experimentalFeatures={{ newEditingApi: true }}
                />
            </div>
        </div>
    );
}