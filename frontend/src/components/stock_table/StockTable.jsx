// frontend/src/components/estoque_table/EstoqueTable.jsx
import React, { useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { BaseDataGrid } from "../common/BaseDataGrid";
import { getStockRowId } from "../../utils/rowIds";

// Função para determinar o status e a cor de fundo com base nos dias de cobertura
const getStatus = (diasDeCobertura) => {
    if (diasDeCobertura === null || diasDeCobertura === undefined) {
        return { text: "Sem demanda", bgColor: "bg-gray-100", textColor: "text-gray-500" };
    }
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

export default function StockTable({ 
    rows = [], 
    isRequisitionMode, 
    rowSelectionModel, 
    onRowSelectionModelChange,
    loading 
}) {
    const columns = useMemo(() => [
        {
            field: "codigo",
            headerName: "Referência",
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
            field: "porto_alegre",
            headerName: "Porto Alegre",
            minWidth: 150,
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "joinville",
            headerName: "Joinville",
            minWidth: 150,
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "sao_paulo",
            headerName: "São Paulo",
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

    // Lógica para o seletor não bugar
    const handleSelectionChange = useCallback((nextSelectionModel) => {
        if (!onRowSelectionModelChange) return;

        // Compatível com versões que retornam array de IDs
        if (Array.isArray(nextSelectionModel)) {
            onRowSelectionModelChange({ type: "include", ids: new Set(nextSelectionModel) });
            return;
        }

        const ids = nextSelectionModel?.ids instanceof Set
            ? nextSelectionModel.ids
            : new Set(nextSelectionModel?.ids || []);

        if (nextSelectionModel?.type === "exclude") {
            // Quando o DataGrid usa "exclude" (ex.: seletor global), convertemos
            // para "include" para manter o hook de estoque consistente.
            const allVisibleIds = new Set(rows.map((row) => row.id));
            ids.forEach((id) => allVisibleIds.delete(id));
            onRowSelectionModelChange({ type: "include", ids: allVisibleIds });
            return;
        }

        onRowSelectionModelChange({ type: "include", ids });
    }, [onRowSelectionModelChange, rows]);

    return (
        <Box sx={{ width: '100%' }}>
            <BaseDataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                headerStyle="alternative"
                
                // Lógica de Seleção
                checkboxSelection={isRequisitionMode}
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={handleSelectionChange}
                
                disableMultipleRowSelection={false}

                getRowId={getStockRowId}
            />
        </Box>
    );
}