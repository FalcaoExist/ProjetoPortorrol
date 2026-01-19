import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useStock } from "../hooks/useStock";
import { importStockFromFile, exportStockData } from "../services/stockService";
import { initialStockData, statusOptions, fornecedorOptions, filialOptions } from "../hooks/mockData";

import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import SearchBar from "../components/common/SearchBar";
import SelectFilter from "../components/common/SelectFilter";
import StockTable from "../components/stock_table/StockTable";
import NewOrderTable from "../components/new_order_table/NewOrderTable";
import ConfirmationModal from "../components/common/ConfirmationModal";

export default function Stock() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [isConfirmOrderModalOpen, setIsConfirmOrderModalOpen] = useState(false);
    const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const {
        isNewOrderVisible,
        newOrderRows,
        rowSelectionModel,
        setRowSelectionModel,
        filteredRows,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        fornecedor,
        setFornecedor,
        filial,
        setFilial,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        handleShowNewOrder,
        handleCloseNewOrder,
        handleNewOrderRowUpdate,
        handleDeleteClick,
        confirmDelete,
        handleCreateOrder
    } = useStock(initialStockData);

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setIsImportConfirmModalOpen(true);
        }
        event.target.value = '';
    };

    const handleConfirmImport = async () => {
        if (selectedFile) {
            try {
                const result = await importStockFromFile(selectedFile);
                alert(result.message); 
            } catch (error) {
                console.error("Erro ao importar arquivo:", error);
                alert(`Erro ao importar: ${error.message}`);
            } finally {
                setSelectedFile(null);
            }
        }
    };

    const handleExportClick = async () => {
        try {
            const result = await exportStockData(filteredRows);
            alert(result.message);
        } catch (error) {
            console.error("Erro ao exportar dados:", error);
            alert(`Erro ao exportar: ${error.message}`);
        }
    };

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Estoque"} userName={user?.name || "Usuário"} />

                    <section className="px-4 py-6 md:px-8 lg:px-12">
                        
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

                        <StockTable 
                            rows={filteredRows}
                            isRequisitionMode={isNewOrderVisible}
                            rowSelectionModel={rowSelectionModel}
                            onRowSelectionModelChange={setRowSelectionModel}
                        />
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex gap-4">
                                <button
                                    onClick={handleShowNewOrder}
                                    className="bg-[#f43629] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md"
                                >
                                    Criar nova requisição
                                </button>
                                {isNewOrderVisible && (
                                    <button
                                        onClick={handleCloseNewOrder}
                                        className="px-4 py-2 font-normal text-gray-700 bg-gray-200 hover:bg-gray-300 font-poppins uppercase text-sm p-2 rounded-md"
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
                                    onClick={handleExportClick}
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
                                <h2 className="text-xl font-semibold mb-4">Itens da Requisição</h2>
                                <NewOrderTable 
                                    rows={newOrderRows} 
                                    handleRowUpdate={handleNewOrderRowUpdate} 
                                    handleDelete={handleDeleteClick} 
                                />
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => setIsConfirmOrderModalOpen(true)}
                                        className="bg-[#f43629] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md"
                                    >
                                        Criar pedido
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Deseja excluir item do pedido?"
                message="O item será removido da lista."
                confirmButtonText="Excluir"
                confirmButtonClassName="px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all bg-[#f43629] hover:bg-white hover:text-black disabled:opacity-60"
            />
            <ConfirmationModal
                isOpen={isConfirmOrderModalOpen}
                onClose={() => setIsConfirmOrderModalOpen(false)}
                onConfirm={() => {
                    handleCreateOrder(navigate);
                }}
                title="Confirmar Novo Pedido"
                message="Você gostaria de fazer um novo pedido?"
                confirmButtonText="Sim"
                cancelButtonText="Cancelar"
                confirmButtonClassName="px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all bg-[#f43629] hover:bg-white hover:text-black disabled:opacity-60"
            />
            <ConfirmationModal
                isOpen={isImportConfirmModalOpen}
                onClose={() => {
                    setSelectedFile(null);
                    setIsImportConfirmModalOpen(false);
                }}
                onConfirm={handleConfirmImport}
                title="Confirmar Importação"
                message={`Você tem certeza que deseja importar o arquivo ${selectedFile?.name}?`}
                confirmButtonText="Importar"
                cancelButtonText="Cancelar"
                confirmButtonClassName="px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all bg-[#f43629] hover:bg-white hover:text-black disabled:opacity-60"
            />
        </div>
    );
}