import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import SearchBar from "../components/common/SearchBar";
import SelectFilter from "../components/common/SelectFilter";
import StockTable from "../components/stock_table/StockTable";
import NewOrderTable from "../components/new_order_table/NewOrderTable";
import { initialStockData, statusOptions, fornecedorOptions, filialOptions } from "../data/mockData";

const getStatusText = (diasDeCobertura) => {
    if (diasDeCobertura <= 30) return "Ruptura iminente";
    if (diasDeCobertura <= 60) return "Subdimensionado";
    if (diasDeCobertura <= 100) return "OK";
    return "Excesso";
};

export default function Stock() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stockData, setStockData] = useState(initialStockData);
    const [isNewOrderVisible, setIsNewOrderVisible] = useState(false);
    const [newOrderRows, setNewOrderRows] = useState([]);

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
                (searchQuery === "" || row.item.toLowerCase().includes(searchQuery.toLowerCase()) || row.codigo.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (statusFilter === "" || statusText === statusFilter) &&
                (fornecedor === "" || row.fornecedor === fornecedor) &&
                (filial === "" || row.filial === filial)
            );
        });
    }, [stockData, searchQuery, statusFilter, fornecedor, filial]);

    const handleShowNewOrder = useCallback(() => {
        setIsNewOrderVisible(true);
    }, []);

    const handleCloseNewOrder = useCallback(() => {
        setIsNewOrderVisible(false);
    }, []);

    const handleNewOrderRowUpdate = useCallback(async (newRow) => {
        setNewOrderRows(prevRows => 
            prevRows.map(row => (row.id === newRow.id ? newRow : row))
        );
        return newRow;
    }, []);

    const handleNewOrderRowDelete = useCallback((id) => {
        setNewOrderRows(prevRows => prevRows.filter(row => row.id !== id));
    }, []);

    const handleCreateOrder = () => {
        if (newOrderRows.length === 0) {
            alert("Por favor, adicione itens ao pedido.");
            return;
        }

        const newOrders = newOrderRows.map((row, index) => {
            const timestamp = Date.now();
            return {
                id: timestamp + index, // Simple unique ID
                numero_pedido: `PED-${timestamp + index}`,
                item: row.item,
                fornecedor: row.fornecedor,
                quantidade: row.unidades,
                filial: row.filial,
                valor: row.valor,
                previsao_entrega: row.previsao_entrega,
                status: "Aprovado",
                data_entrega: null,
            };
        });

        navigate('/orders', { state: { newOrders: newOrders } });
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log(`Arquivo selecionado: ${file.name}`);
        }
    };

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Estoque"} userName={user?.name || "Usuário"} />

                    <section className="px-4 py-6 md:px-8 lg:px-12">
                        {/* ... CÓDIGO DOS FILTROS ... */}
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
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex gap-4">
                                <button
                                    onClick={handleShowNewOrder}
                                    className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md"
                                >
                                    Criar nova requisição
                                </button>
                                {isNewOrderVisible && (
                                    <button
                                        onClick={handleCloseNewOrder}
                                        className="px-4 py-2 font-normal text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 font-poppins uppercase text-sm p-2 rounded-md"
                                    >
                                        Fechar
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleImportClick}
                                    className="px-4 py-2 font-normal text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    IMPORTAR
                                </button>
                                <button
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
                        </div>

                        {isNewOrderVisible && (
                            <div className="mt-6">
                                <NewOrderTable 
                                    rows={newOrderRows} 
                                    handleRowUpdate={handleNewOrderRowUpdate} 
                                    handleDelete={handleNewOrderRowDelete} 
                                />
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={handleCreateOrder}
                                        className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md"
                                    >
                                        Criar pedido
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
