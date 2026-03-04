import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import { BaseDataGrid } from "../components/common/BaseDataGrid";
import { useOrders } from "../hooks/useOrders";
import { getMainOrdersColumns } from "./ordersConfig.jsx";
import { exportRowsCSV } from "../services/csvExporter";
import { exportRowsXLSX } from "../services/xlsxExporter";
import OrderDetailsModal from "../components/order_details_modal/OrderDetailsModal.jsx";
import OrdersFilter from "../components/orders_filter/OrdersFilter.jsx";
import { useRef, useState, useEffect } from "react";
import ordersService from "../services/ordersService";
import ConfirmationModal from "../components/common/ConfirmationModal";
import { importOrdersFromExcel } from "../services/ordersImporter";
import ExportDropdown from "../components/common/ExportDropdown";
import { useSearchParams } from "react-router-dom";
import { logger } from "../utils/logger";

export default function Orders() {
    const { user, showReminder, dismissReminder } = useAuth();
    const {
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        orderDate,
        setOrderDate,
        responsavelFilter,
        setResponsavelFilter,
        fornecedorFilter,
        setFornecedorFilter,
        supplierOptions,
        modalOpen,
        selectedOrderItems,
        handleOpenModal,
        handleCloseModal,
        groupedAndFilteredOrders,
        handleUpdateData,
    } = useOrders();

    useEffect(() => {
        if (showReminder) {
            dismissReminder();
        }
    }, [showReminder, dismissReminder]);

    const mainOrdersColumns = getMainOrdersColumns(handleOpenModal);
    const fileInputRef = useRef(null);
    const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    // Read max import size from env (value in MB). Default to 100 MB if not set.
    const MAX_IMPORT_FILE_SIZE = (Number(import.meta.env.VITE_MAX_IMPORT_FILE_SIZE_MB) || 100) * 1024 * 1024;

     const [searchParams] = useSearchParams();

    useEffect(() => {
        const statusFromParams = searchParams.get("status");
        const fornecedorFromParams = searchParams.get("fornecedor");
        if (statusFromParams) {
            setStatusFilter(statusFromParams);
        }
        if (fornecedorFromParams) {
            setFornecedorFilter(fornecedorFromParams);
        }
    }, [searchParams]);

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size && file.size > MAX_IMPORT_FILE_SIZE) {
                alert(`Arquivo muito grande. Tamanho máximo: ${Math.round(MAX_IMPORT_FILE_SIZE / 1024 / 1024)} MB.`);
            } else {
                setSelectedFile(file);
                setIsImportConfirmModalOpen(true);
            }
        }
        e.target.value = '';
    };

    const handleConfirmImport = async () => {
        if (!selectedFile) return;
        
        try {
            // Agora sim enviamos o arquivo para o Python processar e salvar no Banco!
            const resultado = await ordersService.importOrdersFromFile(selectedFile);
            
            // Avisa que deu certo
            alert(resultado.message || "Pedidos importados com sucesso!");
            
            // Recarrega a página para os novos pedidos aparecerem na tabela na hora
            window.location.reload(); 
            
        } catch (err) {
            alert("Erro: " + err.message);
            console.error('Erro ao importar arquivo: ', err);
        } finally {
            setSelectedFile(null);
            setIsImportConfirmModalOpen(false);
        }
    };

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Pedidos"} userName={user?.name || "Usuário"} />

                    <section className="px-4 py-6 md:px-8 lg:px-12">
                        <div className="flex flex-wrap items-center justify-between mb-6">
                            <OrdersFilter
                                searchQuery={searchQuery}
                                onSearchChange={(e) => setSearchQuery(e.target.value)}
                                statusFilter={statusFilter}
                                onStatusChange={(e) => setStatusFilter(e.target.value)}
                                orderDate={orderDate}
                                onOrderDateChange={(e) => setOrderDate(e.target.value)}
                                responsavelFilter={responsavelFilter}
                                onResponsavelChange={(e) => setResponsavelFilter(e.target.value)}
                                 fornecedorFilter={fornecedorFilter}
                                onFornecedorChange={(e) => setFornecedorFilter(e.target.value)}
                                supplierOptions={supplierOptions}
                            />
                        </div>

                        <BaseDataGrid 
                            rows={groupedAndFilteredOrders}
                            columns={mainOrdersColumns}
                            
                        />

                        <div className="flex justify-end mt-4 space-x-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept=".xlsx"
                            />
                            <button
                                onClick={handleImportClick}
                                className="px-4 py-2 font-normal text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                IMPORTAR PEDIDOS
                            </button>
                           <ExportDropdown
                                options={[{
                                    label: "CSV",
                                    onClick: () => {
                                        const rows = [];
                                        rows.push(["Número do Pedido", "Data do Pedido", "Status", "Item", "Fornecedor", "Quantidade", "Valor", "Filial", "Previsão Entrega", "Data Entrega"]);
                                        groupedAndFilteredOrders.forEach(order => {
                                            order.items.forEach(it => {
                                                rows.push([
                                                    order.numero_pedido,
                                                    order.data_pedido,
                                                    order.status,
                                                    it.item,
                                                    it.fornecedor,
                                                    it.quantidade,
                                                    it.valor,
                                                    it.filial,
                                                    it.previsao_entrega,
                                                    it.data_entrega || "",
                                                ]);
                                            });
                                            rows.push([]);
                                        });
                                        exportRowsCSV(rows, "PEDIDOS");
                                    }
                                },
                                {
                                    label: "Excel",
                                    onClick: () => {
                                        const rows = [];
                                        rows.push(["Número do Pedido", "Data do Pedido", "Status", "Item", "Fornecedor", "Quantidade", "Valor", "Filial", "Previsão Entrega", "Data Entrega"]);
                                        groupedAndFilteredOrders.forEach(order => {
                                            order.items.forEach(it => {
                                                rows.push([
                                                    order.numero_pedido,
                                                    order.data_pedido,
                                                    order.status,
                                                    it.item,
                                                    it.fornecedor,
                                                    it.quantidade,
                                                    it.valor,
                                                    it.filial,
                                                    it.previsao_entrega,
                                                    it.data_entrega || "",
                                                ]);
                                            });
                                            rows.push([]);
                                        });
                                        exportRowsXLSX(rows, "PEDIDOS");
                                    }
                                },
                                ]}
                            />
                        </div>
                    </section>
                </div>
            </main>

            <OrderDetailsModal 
                open={modalOpen}
                onClose={handleCloseModal}
                items={selectedOrderItems}
                updateData={handleUpdateData}
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
