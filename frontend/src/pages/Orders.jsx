import { useState, useEffect, useCallback } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import SelectFilter from "../components/common/SelectFilter";
import OrdersTable from "../components/orders_table/OrdersTable";
import orderService from "../services/orderService";
import { useAuth } from "../context/authContext";

const statusOptions = ["DRAFT", "Aprovado", "Entregue"]; // Ajustado para status do banco
const filialOptions = ["Geral"]; 

export default function Orders() {
    const { user } = useAuth();
    
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros
    const [statusFilter, setStatusFilter] = useState("");
    const [filialFilter, setFilialFilter] = useState("");

    // Carregar Pedidos
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await orderService.getAll();
            setRows(data);
        } catch (error) {
            console.error("Falha ao carregar pedidos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Filtragem Local
    const filteredRows = rows.filter(row => {
        const matchStatus = statusFilter ? row.status === statusFilter : true;
        return matchStatus;
    });

    const handleUpdateData = async (newRow) => {
        // Edição inline desabilitada por enquanto devido à complexidade do banco
        return newRow;
    };

    // Simulação de criação (Botão "Criar nova requisição")
    const handleCreateDummy = async () => {
        // Exemplo de payload para testar a criação complexa
        const novo = {
            item: "ROL-001", // Tente usar um código que EXISTA no seu tb_skus
            fornecedor: "NSK", // Tente usar um fornecedor que EXISTA no suppliers
            quantidade: 10,
            valor: 500.00, // Valor total
            previsao_entrega: new Date().toISOString().split('T')[0]
        };
        try {
            await orderService.create(novo);
            alert("Pedido criado! (Verifique se ROL-001 e NSK existem no banco)");
            fetchOrders(); 
        } catch (e) {
            alert("Erro ao criar: " + (e.response?.data?.detail || e.message));
        }
    };

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />
            <main className="min-w-0 flex flex-col">
                <Header pageTitle={"Pedidos de Compra"} userName={user?.name || "Usuário"} />
                
                <div className="flex-1 bg-gray-50 p-8">
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-wrap gap-4 mb-6">
                            <SelectFilter
                                label="Status"
                                name="status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                options={statusOptions}
                            />
                        </div>

                        {loading ? (
                            <p className="p-10 text-center text-gray-500">Carregando pedidos do banco...</p>
                        ) : (
                            <OrdersTable rows={filteredRows} updateData={handleUpdateData} />
                        )}

                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={handleCreateDummy}
                                className="bg-[#5A44B0] hover:bg-[#4a3794] text-white shadow-lg font-poppins uppercase text-sm p-3 rounded-xl transition-colors"
                            >
                                + Testar Pedido (ROL-001 / NSK)
                            </button>
                            <span className="text-xs text-gray-500">
                                * Para funcionar, 'ROL-001' deve existir em tb_skus e 'NSK' em suppliers.
                            </span>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}