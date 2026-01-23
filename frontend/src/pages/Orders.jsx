import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import { BaseDataGrid } from "../components/common/BaseDataGrid";
import { useOrders } from "../hooks/useOrders";
import { getMainOrdersColumns } from "./ordersConfig.jsx";
import { exportRowsCSV } from "../services/csvExporter";
import OrderDetailsModal from "../components/OrderDetailsModal.jsx";
import OrdersFilter from "../components/OrdersFilter.jsx";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import ConfirmationModal from "../components/common/ConfirmationModal";

export default function Orders() {
    const { user } = useAuth();
    const {
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        orderDate,
        setOrderDate,
        modalOpen,
        selectedOrderItems,
        handleOpenModal,
        handleCloseModal,
        groupedAndFilteredOrders,
        handleUpdateData,
    } = useOrders();

    const mainOrdersColumns = getMainOrdersColumns(handleOpenModal);
    const fileInputRef = useRef(null);
    const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);


    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setIsImportConfirmModalOpen(true);
        }
        e.target.value = '';
    };

    const handleConfirmImport = () => {
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                console.log(json);
                // TODO: Process the imported data and add it to the orders table
            };
            reader.readAsArrayBuffer(selectedFile);
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
                                onOrderDateChange={(e) => setSetOrderDate(e.target.value)}
                            />
                        </div>

                        <BaseDataGrid 
                            rows={groupedAndFilteredOrders}
                            columns={mainOrdersColumns}
                            autoHeight
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
                            <button
                                onClick={() => {
                                    // Monta linhas CSV: cabeçalho em pt-BR
                                    const rows = [];
                                    rows.push(["Número do Pedido", "Data do Pedido", "Status", "Item", "Fornecedor", "Quantidade", "Valor", "Filial", "Previsão Entrega", "Data Entrega"]);
                                    groupedAndFilteredOrders.forEach(order => {
                                        // para cada item, incluir número, data e status do pedido (sem campos vazios)
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
                                        // linha em branco separadora
                                        rows.push([]);
                                    });

                                    exportRowsCSV(rows, "PEDIDOS");
                                }}
                                className="px-4 py-2 font-normal text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                EXPORTAR
                            </button>
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
