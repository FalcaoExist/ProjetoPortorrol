import { useState, useMemo, useRef } from "react";
import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import SearchBar from "../components/common/SearchBar";
import SelectFilter from "../components/common/SelectFilter";
import StockTable from "../components/stock_table/StockTable";
import { initialStockData, statusOptions, fornecedorOptions, filialOptions } from "../data/mockData";

const getStatusText = (diasDeCobertura) => {
    if (diasDeCobertura <= 30) return "Ruptura iminente";
    if (diasDeCobertura <= 60) return "Subdimensionado";
    if (diasDeCobertura <= 100) return "OK";
    return "Excesso";
};

export default function Stock() {
    const { user } = useAuth();
    const [stockData, setStockData] = useState(initialStockData);

    // Estados para os filtros
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [filial, setFilial] = useState("");

    const fileInputRef = useRef(null);

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

    

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log(`Arquivo selecionado: ${file.name}`);
            // A lógica para processar o arquivo (ex: ler um CSV) pode ser adicionada aqui.
        }
    };

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Stock"} userName={user?.name || "Usuário"} />

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

                        <StockTable rows={filteredRows} />
                        <div className="flex justify-end gap-4 mt-4">
                            <button
                                onClick={handleImportClick}
                                className="px-4 py-2 font-normal text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                IMPORTAR
                            </button>
                            <button
                                // onClick={handleExportPDF}
                                className="px-4 py-2 font-normal text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                EXPORTAR
                            </button>
                            <input 
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
