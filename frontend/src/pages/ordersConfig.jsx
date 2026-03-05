
import React from 'react';

export const statusOptions = ["Aprovado", "Atrasado", "Finalizado"];

export const getStatusStyles = (status) => {
    if (status === "Aprovado") return { bgColor: "bg-green-200", textColor: "text-green-800" };
    if (status === "Atrasado") return { bgColor: "bg-red-200", textColor: "text-red-800" };
    if (status === "Finalizado") return { bgColor: "bg-orange-200", textColor: "text-orange-800" };
    return { bgColor: "bg-gray-200", textColor: "text-gray-800" };
};

export const StatusCell = ({ value }) => {
    const styles = getStatusStyles(value);
    return (
        <div className={`inline-block px-2 py-1 text-center rounded-full text-xs font-semibold ${styles.bgColor} ${styles.textColor}`}>
            {value}
        </div>
    );
};

export const getMainOrdersColumns = (handleOpenModal) => [
    { field: "numero_pedido", headerName: "Número do pedido", minWidth: 200, flex: 1.5 },
    { field: "responsavel", headerName: "Responsável", minWidth: 150, flex: 1 },
    { 
        field: "data_pedido", 
        headerName: "Data do pedido", 
        minWidth: 180, 
        flex: 1,
        type: 'date',
        valueGetter: (value) => {
            if (!value) return null;
            const date = new Date(value);
            if (isNaN(date.getTime())) return null; 

            const timeZoneOffset = date.getTimezoneOffset() * 60000;
            return new Date(date.valueOf() + timeZoneOffset);
        },
        valueFormatter: (value) => {
            if (!value) return "-";
            return value.toLocaleDateString("pt-BR");
        }
    },
    {
        field: "status",
        headerName: "Status",
        minWidth: 150,
        flex: 1,
        renderCell: (params) => <StatusCell value={params.value} />,
    },
    {
        field: "fornecedores",
        headerName: "Fornecedores",
        minWidth: 200,
        flex: 1.5,
        renderCell: (params) => {
            const suppliers = [...new Set(params.row.items.map(item => item.fornecedor))].join(', ');
            return (
                <div title={suppliers} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {suppliers}
                </div>
            );
        },
    },
    {
        field: 'actions',
        headerName: 'Detalhes',
        minWidth: 120,
        flex: 0.8,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => (
            <button
                onClick={() => handleOpenModal(params.row.items)}
                className="px-4 py-0 font-normal text-gray-700 rounded-md"
            >
                Ver Itens
            </button>
        ),
    }
];

export const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '1200px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: '8px',
    maxHeight: '80vh',
    overflowY: 'auto',
};
