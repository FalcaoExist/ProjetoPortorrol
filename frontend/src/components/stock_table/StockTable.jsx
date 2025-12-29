// O alinhamento da tabela ajustado para a esquerda, exceto na coluna 'Status', que foi mantida centralizada para melhor visualização.
// frontend/src/components/estoque_table/EstoqueTable.jsx
import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { BaseDataGrid } from "../common/BaseDataGrid";

// Função para determinar o status e a cor de fundo com base nos dias de cobertura
const getStatus = (diasDeCobertura) => {
    if (diasDeCobertura <= 30) {
        return { text: "Ruptura iminente", bgColor: "bg-red-200", textColor: "text-red-800" };
    }
    if (diasDeCobertura <= 60) {
        return { text: "Subdimensionado", bgColor: "bg-orange-200", textColor: "text-orange-800" };
    }
    if (diasDeCobertura <= 100) {
        return { text: "OK", bgColor: "bg-gray-200", textColor: "text-gray-800" };
    }
    return { text: "Excesso", bgColor: "bg-blue-200", textColor: "text-blue-800" };
};

// Componente para renderizar a célula de status com cor
const StatusCell = ({ value }) => {
    const status = getStatus(value);
    return (
        <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${status.bgColor} ${status.textColor}`}>
            {status.text}
        </div>
    );
};

export default function StockTable({ rows = [] }) {
    const columns = useMemo(() => [
        {
            field: "codigo",
            headerName: "Código",
            minWidth: 100,
            flex: 0.8,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "item",
            headerName: "Ítem",
            minWidth: 180,
            flex: 1.5,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "categoria",
            headerName: "Categoria",
            minWidth: 150,
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "unidades",
            headerName: "Unidades",
            type: "number",
            minWidth: 100,
            flex: 0.7,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "fornecedor",
            headerName: "Fornecedor",
            minWidth: 150,
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "filial",
            headerName: "Filial",
            minWidth: 150,
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "dias_cobertura",
            headerName: "Dias de Cobertura",
            type: "number",
            minWidth: 150,
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 160,
            flex: 1,
            renderCell: (params) => <StatusCell value={params.row.dias_cobertura} />,
        },
    ], []);

    return (
        <Box sx={{ width: '100%' }}>
            <BaseDataGrid
                rows={rows}
                columns={columns}
                headerStyle="alternative"
            />
        </Box>
    );
}