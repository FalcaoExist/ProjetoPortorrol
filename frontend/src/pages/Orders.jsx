import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import { BaseDataGrid } from "../components/common/BaseDataGrid";
import { useOrders } from "../hooks/useOrders";
import { getMainOrdersColumns } from "./ordersConfig.jsx";
import OrderDetailsModal from "../components/OrderDetailsModal.jsx";
import OrdersFilter from "../components/OrdersFilter.jsx";

export default function Orders() {
    const { user } = useAuth();
    const {
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        fornecedor,
        setFornecedor,
        filial,
        setFilial,
        modalOpen,
        selectedOrderItems,
        handleOpenModal,
        handleCloseModal,
        groupedAndFilteredOrders,
        handleUpdateData,
    } = useOrders();

    const mainOrdersColumns = getMainOrdersColumns(handleOpenModal);

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
                                fornecedor={fornecedor}
                                onFornecedorChange={(e) => setFornecedor(e.target.value)}
                                filial={filial}
                                onFilialChange={(e) => setFilial(e.target.value)}
                            />
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

            <OrderDetailsModal 
                open={modalOpen}
                onClose={handleCloseModal}
                items={selectedOrderItems}
                updateData={handleUpdateData}
            />
        </div>
    );
}
