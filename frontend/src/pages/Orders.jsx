import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import { BaseDataGrid } from "../components/common/BaseDataGrid";
import { useOrders } from "../hooks/useOrders";
import { useOrdersPageLogic } from "../hooks/useOrdersPageLogic";
import { getMainOrdersColumns } from "./ordersConfig.jsx";
import { exportRowsCSV } from "../services/csvExporter";
import { exportRowsXLSX } from "../services/xlsxExporter";
import OrderDetailsModal from "../components/order_details_modal/OrderDetailsModal.jsx";
import OrdersFilter from "../components/orders_filter/OrdersFilter.jsx";
import ConfirmationModal from "../components/common/ConfirmationModal";
import ExportDropdown from "../components/common/ExportDropdown";

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
        loading,
        fetchOrders,
    } = useOrders();

    const mainOrdersColumns = getMainOrdersColumns(handleOpenModal);
    const {
        fileInputRef,
        selectedFile,
        isImportConfirmModalOpen,
        exportRows,
        handleImportClick,
        handleFileChange,
        handleConfirmImport,
        closeImportModal,
    } = useOrdersPageLogic({
        setStatusFilter,
        setFornecedorFilter,
        groupedAndFilteredOrders,
        showReminder,
        dismissReminder,
        onImportSuccess: fetchOrders,
    });

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
                            loading={loading}
                            initialState={{
                                sorting: {
                                    sortModel: [{ field: "data_pedido", sort: "desc" }],
                                },
                            }}
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
                                        exportRowsCSV(exportRows, "PEDIDOS");
                                    }
                                },
                                {
                                    label: "Excel",
                                    onClick: () => {
                                        exportRowsXLSX(exportRows, "PEDIDOS");
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
                onClose={closeImportModal}
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
