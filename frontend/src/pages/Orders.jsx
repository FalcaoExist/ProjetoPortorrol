import { useState, useMemo } from "react";
import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import SearchBar from "../components/common/SearchBar";
import SelectFilter from "../components/common/SelectFilter";
import OrdersTable from "../components/orders_table/OrdersTable";

const statusOptions = ["Aprovado", "Atrasado"];
const fornecedorOptions = ["NSK", "Timken", "FRM", "BGL", "IKO", "SAV"];
const filialOptions = ["Porto Alegre", "Joinville", "São Paulo"];

const initialOrdersData = [
    { id: 1, numero_pedido: "PED-001", item: "ANEL FRB 100/11,5", fornecedor: "NSK", quantidade: 100, filial: "Porto Alegre", valor: 5000, previsao_entrega: "2024-10-20", status: "Aprovado", data_entrega: null },
    { id: 2, numero_pedido: "PED-002", item: "ANEL FRB 100/11,5", fornecedor: "Timken", quantidade: 50, filial: "Joinville", valor: 2500, previsao_entrega: "2024-09-15", status: "Atrasado", data_entrega: null },
    { id: 3, numero_pedido: "PED-003", item: "ANEL FRB 100/11,5", fornecedor: "FRM", quantidade: 200, filial: "São Paulo", valor: 10000, previsao_entrega: "2024-11-01", status: "Aprovado", data_entrega: null },
];

export default function Orders() {
    const { user } = useAuth();
    const [ordersData, setOrdersData] = useState(initialOrdersData);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [filial, setFilial] = useState("");

    const filteredRows = useMemo(() => {
        return ordersData.filter(row => {
            return (
                (searchQuery === "" || row.item.toLowerCase().includes(searchQuery.toLowerCase()) || row.numero_pedido.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (statusFilter === "" || row.status === statusFilter) &&
                (fornecedor === "" || row.fornecedor === fornecedor) &&
                (filial === "" || row.filial === filial)
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
                                    placeholder="Buscar por número do pedido ou item..."
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
                            <button
                                // onClick={handleExportPDF}
                                className="px-4 py-2 font-normal text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                EXPORTAR
                            </button>
                        </div>

                        <OrdersTable rows={filteredRows} updateData={handleUpdateData} />
                    </section>
                </div>
            </main>
        </div>
    );
}
