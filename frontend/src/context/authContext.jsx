import { createContext, useContext, useState, useEffect } from "react";
import httpClient from "../services/validators/api/httpClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReminder, setShowReminder] = useState(false);

useEffect(() => {
        const checkSession = async () => {
            try {
                // Tenta validar a sessão no backend (cookie)
                const data = await httpClient.get("/me");
                if (data && data.success) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                // Se der erro  considera deslogado
                console.log("Sessão inválida ou expirada");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const checkAndShowReminder = (currentUser) => {
        // Lembrete agora é para todos os usuários logados
        if (currentUser) {
            const lastDismissed = localStorage.getItem('lastReminderDismissedTimestamp');
            const fortyEightHours = 48 * 60 * 60 * 1000;

            if (!lastDismissed || (Date.now() - parseInt(lastDismissed, 10)) > fortyEightHours) {
                setShowReminder(true);
            }
        }
    };

    const dismissReminder = () => {
        setShowReminder(false);
        localStorage.setItem('lastReminderDismissedTimestamp', Date.now().toString());
    };

    // -------------------------------------------------------------------------
    // LOGIN
    // -------------------------------------------------------------------------
    const login = async (email, password) => {
        try {
            const data = await httpClient.post("/login", { email, password });

            if (data.success) {
                if (data.user?.is_active === false) {
                    return {
                        success: false,
                        message: "Acesso negado: Sua conta está desativada."
                    };
                }

                // Salva o usuário no estado
                setUser(data.user);
                localStorage.setItem("user_data", JSON.stringify(data.user));

                // Lógica do lembrete
                checkAndShowReminder(data.user);

                // Retorna a 'role' para que a página de Login saiba para onde redirecionar
                return {
                    success: true,
                    role: data.user.role
                };
            }

            // CASO 2: Backend retornou ERRO (senha errada, etc)
            else {
                const msgErro = data.message || data.detail || "Credenciais inválidas.";
                return {
                    success: false,
                    message: msgErro
                };
            }

        } catch (error) {
            console.error("Erro no login context:", error);
            // Tenta pegar a mensagem de erro que veio do httpClient
            const msg = error.data?.message || error.data?.detail || "Erro de conexão.";
            return { success: false, message: msg };
        }
    };
    const logout = async () => {
        try {
            await httpClient.post("/logout", {});
        } catch (error) {
            console.error("Erro ao fazer logout no servidor", error);
        } finally {
            setUser(null);
            // Redireciona
            window.location.href = "/";
        }
    };
    

    // Helper para verificar permissão facilmente nos componentes
    const isGestor = user?.role === "gestor";

    return (
        <AuthContext.Provider value={{ user, login, logout, isGestor, loading, showReminder, dismissReminder }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
    