import React from 'react';

// Opções para filtros, se necessário
export const statusOptions = ["Aprovado", "Pendente", "Cancelado", "Atrasado"];

export const getStatusStyles = (status) => {
    // Normaliza para maiúsculo para garantir, ou compara direto
    const s = String(status).toUpperCase();

    if (s === "APPROVED" || s === "COMPLETED" || s === "APROVADO") {
        return { bgColor: "bg-green-200", textColor: "text-green-800", label: "Aprovado" };
    }
    if (s === "CANCELLED" || s === "ATRASADO") {
        return { bgColor: "bg-red-200", textColor: "text-red-800", label: "Cancelado/Atrasado" };
    }
    if (s === "PENDING" || s === "DRAFT") {
        return { bgColor: "bg-yellow-100", textColor: "text-yellow-800", label: "Pendente" };
    }
    
    // Padrão (Gray)
    return { bgColor: "bg-gray-200", textColor: "text-gray-800", label: status };
};

export const StatusCell = ({ value }) => {
    const style = getStatusStyles(value);
    
    return (
        <div className={`inline-block px-2 py-1 text-center rounded-full text-xs font-semibold ${style.bgColor} ${style.textColor}`}>
            {style.label}
        </div>
    );
};

export const getMainOrdersColumns = (handleOpenModal) => [
    { 
        field: "order_id", // Adaptado para o backend
        headerName: "Número do pedido", 
        minWidth: 250, // Aumentei um pouco pois UUID é longo
        flex: 1.5,
        renderCell: (params) => (
             <span title={params.value} className="text-xs font-mono text-gray-600">
                 {params.value}
             </span>
        )
    },
    { 
        field: "created_at", // Adaptado para o backend
        headerName: "Data do pedido", 
        minWidth: 180, 
        flex: 1,
        type: 'date',
        valueGetter: (params) => {
            if (!params.value) return null;
            const date = new Date(params.value);
            if (isNaN(date.getTime())) return null; 
            // Sua lógica original de fuso horário
            const timeZoneOffset = date.getTimezoneOffset() * 60000;
            return new Date(date.valueOf() + timeZoneOffset);
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
        field: 'actions',
        headerName: 'Detalhes',
        minWidth: 120,
        flex: 0.8,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => (
            <button
                // Passa o ID para o modal filtrar os itens
                onClick={() => handleOpenModal(params.row.order_id)}
                className="px-4 py-1 font-normal text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
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
};