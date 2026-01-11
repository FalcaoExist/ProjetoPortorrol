import React, { useMemo, useState } from 'react';
import { BaseDataGrid } from '../common/BaseDataGrid';
import { IconButton } from '@mui/material';
import { FaTrash } from 'react-icons/fa';
import { filialOptions } from '../../data/mockData';
import ConfirmationModal from '../common/ConfirmationModal';

export default function NewOrderTable({ rows = [], handleRowUpdate, handleDelete }) {
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

    const processRowUpdate = async (newRow, oldRow) => {
        const updatedRow = await handleRowUpdate(newRow);
        return updatedRow;
    };

    const handleConfirmOrder = () => {
        console.log("Pedido confirmado!");
        // Aqui vai a lógica para criar o pedido
        setConfirmModalOpen(false);
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
            type: 'singleSelect',
            valueOptions: filialOptions,
            align: 'left',
            headerAlign: 'left',
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
                if (typeof value !== 'number') return '';
                return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
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
                const date = new Date(params.value);
                if (date instanceof Date && !isNaN(date)) {
                    const year = date.getUTCFullYear();
                    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                    const day = date.getUTCDate().toString().padStart(2, '0');
                    return `${day}/${month}/${year}`;
                }
                return '';
            },
        },
    ], [handleDelete]);

    return (
        <div className="flex flex-col items-center w-full">
            <div style={{ height: 'auto', width: '100%' }}>
                <BaseDataGrid
                    rows={rows}
                    columns={columns}
                    processRowUpdate={processRowUpdate}
                    onProcessRowUpdateError={(error) => console.error(error)}
                    experimentalFeatures={{ newEditingApi: true }}
                    autoHeight
                />
            </div>
            {rows.length > 0 && (
                <button
                    onClick={() => setConfirmModalOpen(true)}
                    className="mt-4 px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all bg-[#5A44B0] hover:bg-[#4e3a9a] disabled:opacity-60"
                >
                    Criar pedido
                </button>
            )}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmOrder}
                title="Concluir Pedido"
                message="Deseja concluir o pedido?"
                confirmButtonText="Sim"
                cancelButtonText="Cancelar"
            />
        </div>
    );
}
