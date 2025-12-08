import { createContext, useContext, useState, useEffect } from "react";
import httpClient from "../services/validators/api/httpClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const checkSession = async () => {
            try {
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

    const login = async (email, password) => {
        try {
            const data = await httpClient.post("/login", { email, password });

            if (data.success) {
                if (data.user?.is_active === false) {
                    return { success: false, message: "Conta desativada." };
                }

                setUser(data.user);
                return { success: true, role: data.user.role };
            } else {
                return { success: false, message: data.message || "Erro no login." };
            }

        } catch (error) {
            console.error("Erro no login context:", error);
            // Tenta pegar a mensagem de erro que veio do httpClient
            const msg = error.data?.message || error.data?.detail || "Erro de conexão.";
            return { success: false, message: msg };
        }
    };

    // 3. Logout
    const logout = async () => {
        try {
            await httpClient.post("/logout", {});
        } catch (error) {
            console.error("Erro ao fazer logout no servidor", error);
        } finally {
            setUser(null);
            window.location.href = "/";
        }
    };

    const isGestor = user?.role === "gestor";

    return (
        <AuthContext.Provider value={{ user, login, logout, isGestor, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);