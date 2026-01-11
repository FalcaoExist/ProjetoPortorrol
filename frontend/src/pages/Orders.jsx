import { useState, useMemo } from "react";
import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import SearchBar from "../components/common/SearchBar";
import SelectFilter from "../components/common/SelectFilter";
import OrdersTable from "../components/orders_table/OrdersTable";
import { BaseDataGrid } from "../components/common/BaseDataGrid";
import { Box, Modal } from "@mui/material";

const statusOptions = ["Aprovado", "Atrasado"];
const fornecedorOptions = ["NSK", "Timken", "FRM", "BGL", "IKO", "SAV"];
const filialOptions = ["Porto Alegre", "Joinville", "São Paulo"];

const initialOrdersData = [
    { id: 1, numero_pedido: "PED-001", item: "ANEL FRB 100/11,5", fornecedor: "NSK", quantidade: 100, filial: "Porto Alegre", valor: 5000, previsao_entrega: "2024-10-20", status: "Aprovado", data_entrega: null, data_pedido: "2024-07-20" },
    { id: 4, numero_pedido: "PED-001", item: "ROLAMENTO 6203", fornecedor: "NSK", quantidade: 20, filial: "Porto Alegre", valor: 1000, previsao_entrega: "2024-10-20", status: "Aprovado", data_entrega: null, data_pedido: "2024-07-20" },
    { id: 2, numero_pedido: "PED-002", item: "ANEL FRB 100/11,5", fornecedor: "Timken", quantidade: 50, filial: "Joinville", valor: 2500, previsao_entrega: "2024-09-15", status: "Atrasado", data_entrega: null, data_pedido: "2024-08-10" },
    { id: 3, numero_pedido: "PED-003", item: "ANEL FRB 100/11,5", fornecedor: "FRM", quantidade: 200, filial: "São Paulo", valor: 10000, previsao_entrega: "2024-11-01", status: "Aprovado", data_entrega: null, data_pedido: "2024-08-25" },
];

const getStatusStyles = (status) => {
    if (status === "Aprovado") return { bgColor: "bg-green-200", textColor: "text-green-800" };
    if (status === "Atrasado") return { bgColor: "bg-red-200", textColor: "text-red-800" };
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

const modalStyle = {
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


export default function Orders() {
    const { user } = useAuth();
    const [ordersData, setOrdersData] = useState(initialOrdersData);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [filial, setFilial] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);

    const handleOpenModal = (items) => {
        setSelectedOrderItems(items);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedOrderItems([]);
    };

    const groupedAndFilteredOrders = useMemo(() => {
        const grouped = ordersData.reduce((acc, item) => {
            if (!acc[item.numero_pedido]) {
                acc[item.numero_pedido] = {
                    id: item.numero_pedido,
                    numero_pedido: item.numero_pedido,
                    data_pedido: item.data_pedido,
                    items: [],
                };
            }
            acc[item.numero_pedido].items.push(item);
            return acc;
        }, {});

        return Object.values(grouped).map(order => {
            const hasDelayedItem = order.items.some(item => item.status === "Atrasado");
            const orderStatus = hasDelayedItem ? "Atrasado" : "Aprovado";
            const uniqueFornecedores = [...new Set(order.items.map(item => item.fornecedor))];
            const uniqueFiliais = [...new Set(order.items.map(item => item.filial))];

            return {
                ...order,
                status: orderStatus,
                fornecedores: uniqueFornecedores,
                filiais: uniqueFiliais,
            };
        }).filter(order => {
            const searchLower = searchQuery.toLowerCase();
            return (
                (searchQuery === "" || order.numero_pedido.toLowerCase().includes(searchLower)) &&
                (statusFilter === "" || order.status === statusFilter) &&
                (fornecedor === "" || order.fornecedores.includes(fornecedor)) &&
                (filial === "" || order.filiais.includes(filial))
            );
        });
    }, [ordersData, searchQuery, statusFilter, fornecedor, filial]);

    const handleUpdateData = (id, field, value) => {
        setOrdersData(currentData =>
            currentData.map(row =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };
    
    const mainOrdersColumns = [
        { field: "numero_pedido", headerName: "Número do pedido", minWidth: 200, flex: 1.5 },
        { 
            field: "data_pedido", 
            headerName: "Data do pedido", 
            minWidth: 180, 
            flex: 1,
            type: 'date',
            valueGetter: (params) => new Date(params.value)
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
                    onClick={() => handleOpenModal(params.row.items)}
                    className="px-4 py-2 font-normal text-gray-700 rounded-md"
                >
                    Ver Itens
                </button>
            ),
        }
    ];

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Pedidos"} userName={user?.name || "Usuário"} />

                    <section className="px-4 py-6 md:px-8 lg:px-12">
                        <div className="flex flex-wrap items-center justify-between mb-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <SearchBar
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar por número do pedido..."
                                />
                                <SelectFilter
                                    label="Status"
                                    name="status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    options={statusOptions}
                                />
                                <SelectFilter
                                    label="Fornecedor"
                                    name="fornecedor"
                                    value={fornecedor}
                                    onChange={(e) => setFornecedor(e.target.value)}
                                    options={fornecedorOptions}
                                />
                                <SelectFilter
                                    label="Filial"
                                    name="filial"
                                    value={filial}
                                    onChange={(e) => setFilial(e.target.value)}
                                    options={filialOptions}
                                />
                            </div>
                        </div>

                        <BaseDataGrid 
                            rows={groupedAndFilteredOrders}
                            columns={mainOrdersColumns}
                            autoHeight
                        />

                        <div className="flex justify-end mt-4">
                            <button
                                // onClick={handleExportPDF}
                                className="px-4 py-2 font-normal text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                EXPORTAR
                            </button>
                        </div>
                    </section>
                </div>
            </main>

            <Modal
                open={modalOpen}
                onClose={handleCloseModal}
                aria-labelledby="order-details-modal-title"
                aria-describedby="order-details-modal-description"
            >
                <Box sx={modalStyle}>
                    <h2 id="order-details-modal-title" className="mb-4 text-xl font-semibold">
                        Itens do Pedido: {selectedOrderItems[0]?.numero_pedido}
                    </h2>
                    <OrdersTable rows={selectedOrderItems} updateData={handleUpdateData} />
                </Box>
            </Modal>
        </div>
    );
}