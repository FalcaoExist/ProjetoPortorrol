import React, { useMemo } from "react";
import { BaseDataGrid } from "../common/BaseDataGrid";

const getStatusStyles = (status) => {
    if (status === "Aprovado") {
        return { bgColor: "bg-green-200", textColor: "text-green-800" };
    }
    if (status === "Atrasado") {
        return { bgColor: "bg-red-200", textColor: "text-red-800" };
    }
    return { bgColor: "bg-gray-200", textColor: "text-gray-800" };
};

const StatusCell = ({ value }) => {
    const styles = getStatusStyles(value);
    return (
        <div className={`inline-block px-2 py-1 text-center rounded-full text-xs font-semibold ${styles.bgColor} ${styles.textColor}`}>
            {value}
        </div>
    );
};

const EditDateCell = (props) => {
    const { id, value, field, api } = props;

    const handleChange = (event) => {
        const newDate = event.target.value ? new Date(event.target.value) : null;
        if (newDate) {
            const timeZoneOffset = newDate.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(newDate.valueOf() + timeZoneOffset);
            api.setEditCellValue({ id, field, value: adjustedDate });
        } else {
            api.setEditCellValue({ id, field, value: null });
        }
    };

    const dateValue = value instanceof Date ? value.toISOString().split('T')[0] : '';

    return (
        <input 
            type="date" 
            value={dateValue}
            onChange={handleChange} 
            className="w-full h-full border-none outline-none bg-transparent"
        />
    );
};

export default function OrdersTable({ rows = [], updateData, onViewDetails }) {
    const processRowUpdate = (newRow) => {
        const dateString = newRow.data_entrega ? newRow.data_entrega.toISOString().split('T')[0] : null;
        updateData(newRow.id, "data_entrega", dateString);
        console.log("Dados chegando na tabela:", rows);
        return newRow;
    };
    
    const createUTCDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const timeZoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.valueOf() + timeZoneOffset);
    };

const rowsWithDateObjects = useMemo(() => rows.map(row => ({
        ...row,
        previsao_entrega: createUTCDate(row.previsao_entrega),
        data_entrega: createUTCDate(row.data_entrega),
        data_pedido: createUTCDate(row.data_pedido || row.created_at)
    })), [rows]);


    const columns = useMemo(() => [
        { field: "numero_pedido", headerName: "Número do pedido", minWidth: 150, flex: 1 },
        { field: "item", headerName: "Item", minWidth: 180, flex: 1.5 },
        { field: "fornecedor", headerName: "Fornecedor", minWidth: 150, flex: 1 },
        { field: "quantidade", headerName: "Quantidade", type: "number", minWidth: 100, flex: 0.7, align: "left", headerAlign: "left" },
        { field: "filial", headerName: "Filial", minWidth: 150, flex: 1 },
        { 
            field: "valor", 
            headerName: "Valor (R$)", 
            type: "number", 
            minWidth: 120, 
            flex: 0.8,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                const value = params.value;
                if (value === null || value === undefined) {
                    return '';
                }
                return `R$ ${Number(value).toFixed(2)}`;
            }
        },
        { field: "previsao_entrega", headerName: "Previsão de entrega", minWidth: 150, flex: 1, type: 'date' },
        {
            field: "status",
            headerName: "Status",
            minWidth: 120,
            flex: 1,
            renderCell: (params) => <StatusCell value={params.value} />,
        },
        {
            field: "data_entrega",
            headerName: "Data de entrega",
            minWidth: 180,
            flex: 1,
            editable: true,
            type: 'date',
            renderEditCell: EditDateCell,
        },
    ], []);

    return (
        <BaseDataGrid
            rows={rowsWithDateObjects}
            columns={columns}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(error) => console.error(error)}
            experimentalFeatures={{ newEditingApi: true }}
        />
    );
}
