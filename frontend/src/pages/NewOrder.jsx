import { useState } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import { useAuth } from "../context/authContext";
import SearchBar from "../components/common/SearchBar";
import SelectFilter from "../components/common/SelectFilter";
import NewOrderTable from "../components/new_order_table/NewOrderTable";
import AddItemModal from "../components/add_item_modal/AddItemModal";
import ConfirmationModal from "../components/common/ConfirmationModal";
import * as mockData from "../data/mockData";

export default function NewOrder() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [filial, setFilial] = useState("");
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    
    const [suggestedItems, setSuggestedItems] = useState(() => {
        // Inicializa itens sugeridos a partir do estoque mockado
        return mockData.initialStockData.map(item => ({
            ...item,
            unidades: item.unidades || 0,
            valor: item.valor || 0,
            previsao_entrega: new Date()
        }));
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [isAddConfirmModalOpen, setIsAddConfirmModalOpen] = useState(false);
    const [itemToAdd, setItemToAdd] = useState(null);

    const handleAddItemClick = (newItem) => {
        if (suggestedItems.some(item => item.id === newItem.id)) {
            return; 
        }
        setItemToAdd(newItem);
        setIsAddConfirmModalOpen(true);
        setIsAddItemModalOpen(false);
    };

    const confirmAddItem = () => {
        if (!itemToAdd) return;
        const formattedNewItem = {
            ...itemToAdd,
            unidades: itemToAdd.unidades || 0,
            valor: itemToAdd.valor || 0,
            previsao_entrega: new Date()
        };
        setSuggestedItems(prevItems => [...prevItems, formattedNewItem]);
        setItemToAdd(null);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        setSuggestedItems(prevItems => prevItems.filter(item => item.id !== itemToDelete));
        setItemToDelete(null);
    };

    const handleRowUpdate = (newRow) =>
        new Promise((resolve) => {
            setSuggestedItems((prevItems) => {
                const newItems = prevItems.map((item) =>
                    item.id === newRow.id ? newRow : item
                );
                resolve(newRow);
                return newItems;
            });
        });

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />
            <main className="min-w-0">
                <Header pageTitle={"Novo Pedido"} userName={user?.name || "Usuário"} />
                <section className="px-4 py-6 md:px-8 lg:px-12">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
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
                            options={mockData.statusOptions}
                        />
                        <SelectFilter
                            label="Fornecedor"
                            name="fornecedor"
                            value={fornecedor}
                            onChange={(e) => setFornecedor(e.target.value)}
                            options={mockData.fornecedorOptions}
                        />
                        <SelectFilter
                            label="Filial"
                            name="filial"
                            value={filial}
                            onChange={(e) => setFilial(e.target.value)}
                            options={mockData.filialOptions}
                        />
                    </div>
                    <NewOrderTable 
                        rows={suggestedItems}
                        handleDelete={handleDeleteClick}
                        handleRowUpdate={handleRowUpdate}
                    />
                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={() => setIsAddItemModalOpen(true)}
                            className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md"
                        >
                            Adicionar item
                        </button>
                        <button
                            className="px-4 py-2 font-normal text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            EXPORTAR
                        </button>
                    </div>
                </section>
            </main>
            <AddItemModal 
                open={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                onAddItem={handleAddItemClick}
            />
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Deseja excluir item do pedido?"
                message="O item será removido da lista."
                confirmButtonText="Excluir"
            />
            <ConfirmationModal
                isOpen={isAddConfirmModalOpen}
                onClose={() => setIsAddConfirmModalOpen(false)}
                onConfirm={confirmAddItem}
                title="Deseja incluir item em novo pedido?"
                message={`Você está prestes a adicionar o item "${itemToAdd?.item}" ao pedido.`}
                confirmButtonText="Incluir"
            />
        </div>
    );
}
