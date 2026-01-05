import { useState } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import { useAuth } from "../context/authContext";
import SearchBar from "../components/common/SearchBar";
import SelectFilter from "../components/common/SelectFilter";
import NewOrderTable from "../components/new_order_table/NewOrderTable";

const statusOptions = ["Subdimensionado", "Ok", "Excesso", "Ruptura iminente"];
const fornecedorOptions = ["NSK", "Timken", "FRM", "BGL", "IKO", "SAV"];
const filialOptions = ["Porto Alegre", "Joinville", "São Paulo"];

// Mock data for stock - in a real app, this would come from an API
const initialStockData = [
    { id: 1, codigo: "ROL-001", item: "ANel FRB 100/11,5", categoria: "Rolamento x", unidades: 150, fornecedor: "NSK", filial: "Porto Alegre", dias_cobertura: 25, valor: 100 },
    { id: 2, codigo: "ROL-002", item: "ANel FRB 100/11,5", categoria: "Rolamento x", unidades: 80, fornecedor: "Timken", filial: "Joinville", dias_cobertura: 45, valor: 200 },
    { id: 3, codigo: "RET-001", item: "ANel FRB 100/11,5", categoria: "Rolamento x", unidades: 300, fornecedor: "FRM", filial: "São Paulo", dias_cobertura: 75, valor: 300 },
    { id: 4, item: "Item D", fornecedor: "BGL", dias_cobertura: 60, valor: 150.00 },
];

const suggestedItemsData = initialStockData
    .filter(item => item.dias_cobertura <= 60)
    .map(item => ({
        ...item,
        unidades: item.unidades || 0,
        valor: item.valor || 0,
        previsao_entrega: new Date().toISOString().split('T')[0] // Default to today
    }));


export default function NewOrder() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [filial, setFilial] = useState("");

    const [suggestedItems, setSuggestedItems] = useState(suggestedItemsData);

    const handleDelete = (id) => {
        setSuggestedItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const handleRowUpdate = (newRow) => {
        setSuggestedItems(prevItems =>
            prevItems.map(item =>
                item.id === newRow.id ? newRow : item
            )
        );
        return newRow;
    };

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
                    <NewOrderTable 
                        rows={suggestedItems}
                        handleDelete={handleDelete}
                        handleRowUpdate={handleRowUpdate}
                    />
                </section>
            </main>
        </div>
    );
}
