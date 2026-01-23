import { useAuth } from "../context/authContext";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import { BaseDataGrid } from "../components/common/BaseDataGrid";
import { useOrders } from "../hooks/useOrders";
import { getMainOrdersColumns } from "./ordersConfig.jsx";
import { exportRowsCSV } from "../services/csvExporter";
import OrderDetailsModal from "../components/OrderDetailsModal.jsx";
import OrdersFilter from "../components/OrdersFilter.jsx";

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
                            />
                        </div>

                        <BaseDataGrid 
                            rows={groupedAndFilteredOrders}
                            columns={mainOrdersColumns}
                            autoHeight
                        />

                        <div className="flex justify-end mt-4">
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
        </div>
    );
}
