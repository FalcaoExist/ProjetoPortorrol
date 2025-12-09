import { useState, useMemo } from "react";
import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import SearchBar from "../components/common/SearchBar";
import SelectFilter from "../components/common/SelectFilter";
import EstoqueTable from "../components/estoque_table/EstoqueTable";

// Opções para os filtros
const statusOptions = ["OK", "Subdimensionado", "Ruptura iminente", "Excesso"];
const fornecedorOptions = ["NSK", "Timken", "FRM", "BGL", "IKO", "SAV"];
const filialOptions = ["Porto Alegre", "Joinville", "São Paulo"];

// Mock data para a tabela de estoque
const initialStockData = [
    { id: 1, codigo: "ROL-001", item: "ANel FRB 100/11,5", categoria: "Rolamento x", unidades: 150, fornecedor: "NSK", filial: "Porto Alegre", dias_cobertura: 25 },
    { id: 2, codigo: "ROL-002", item: "ANel FRB 100/11,5", categoria: "Rolamento x", unidades: 80, fornecedor: "Timken", filial: "Joinville", dias_cobertura: 45 },
    { id: 3, codigo: "RET-001", item: "ANel FRB 100/11,5", categoria: "Rolamento x", unidades: 300, fornecedor: "FRM", filial: "São Paulo", dias_cobertura: 75 },
];

const getStatusText = (diasDeCobertura) => {
    if (diasDeCobertura <= 30) return "Ruptura iminente";
    if (diasDeCobertura <= 60) return "Subdimensionado";
    if (diasDeCobertura <= 100) return "OK";
    return "Excesso";
};

export default function Estoque() {
    const { user } = useAuth();
    const [stockData, setStockData] = useState(initialStockData);

    // Estados para os filtros
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [filial, setFilial] = useState("");

    const filteredRows = useMemo(() => {
        return stockData.filter(row => {
            const statusText = getStatusText(row.dias_cobertura);
            return (
                // Filtro de busca
                (searchQuery === "" || row.item.toLowerCase().includes(searchQuery.toLowerCase()) || row.codigo.toLowerCase().includes(searchQuery.toLowerCase())) &&
                // Filtro de status
                (statusFilter === "" || statusText === statusFilter) &&
                // Filtro de fornecedor
                (fornecedor === "" || row.fornecedor === fornecedor) &&
                // Filtro de filial
                (filial === "" || row.filial === filial)
            );
        });
    }, [stockData, searchQuery, statusFilter, fornecedor, filial]);

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Estoque"} userName={user?.name || "Usuário"} />

                    <section className="px-4 py-6 md:px-8 lg:px-12">
                        {/* Container para os filtros */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <SearchBar
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por código ou item..."
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

                        <EstoqueTable rows={filteredRows} />
                    </section>
                </div>
            </main>
        </div>
    );
}
