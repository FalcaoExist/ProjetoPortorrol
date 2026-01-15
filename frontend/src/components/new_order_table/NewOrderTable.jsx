import React, { useMemo } from 'react';
import { BaseDataGrid } from '../common/BaseDataGrid';
import { IconButton } from '@mui/material';
import { FaTrash } from 'react-icons/fa';
import { filialOptions } from '../../hooks/mockData';

export default function NewOrderTable({ rows = [], handleRowUpdate, handleDelete }) {
    const processRowUpdate = async (newRow, oldRow) => {
        const updatedRow = await handleRowUpdate(newRow);
        return updatedRow;
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

    renderCell: (params) => {
        
        if (!params.isEditable) return "";

        return params.value ?? "";
    },
},
        {
            field: "valor",
            headerName: "Valor (R$)",
            type: "number",
            minWidth: 120,
            flex: 0.8,
            editable: true,
            align: 'left',
            headerAlign: 'left',
            valueFormatter: ({ value }) => {
    if (value == null || value === "") return "";

    const number = typeof value === "number" ? value : Number(value);
    if (isNaN(number)) return "";

    return number.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
},
    valueSetter: (params) => {
    const n = Number(params.value);

    return {
        ...params.row,
        valor: isNaN(n) ? 0 : n,
    };
},
        },
        {
            field: "previsao_entrega",
            headerName: "Previsão de entrega",
            type: 'date',
            minWidth: 180,
            flex: 1,
            editable: true,
            align: 'left',
            headerAlign: 'left',
            valueFormatter: (params) => {
                if (!params.value) return '';
                const date = params.value instanceof Date ? params.value : new Date(params.value);
                if (isNaN(date.getTime())) return '';
                return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            },
            valueSetter: (params) => {
    const date = new Date(params.value);

    return {
        ...params.row,
        previsao_entrega: isNaN(date.getTime()) ? null : date,
    };
},
            
        },
    ], [handleDelete]);

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
