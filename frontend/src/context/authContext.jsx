import { createContext, useContext, useState, useEffect } from "react";
import httpClient from "../services/validators/api/httpClient";
import { logger } from "../utils/logger";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReminder, setShowReminder] = useState(false);

useEffect(() => {
        const checkSession = async () => {
            try {
                const data = await httpClient.get("/me");
                if (data && data.success) {
                    setUser(data.user);
                } else {
                    setUser(null);
                    try { localStorage.removeItem("user_data"); localStorage.removeItem("user"); } catch (e) {}
                }
            } catch (error) {
                logger.warn("Sessão inválida ou expirada");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const checkAndShowReminder = (currentUser) => {
        if (currentUser) {
            const lastDismissed = localStorage.getItem('lastReminderDismissedTimestamp');
            const twentyFourHours = 24 * 60 * 60 * 1000;
            
            if (!lastDismissed || (Date.now() - parseInt(lastDismissed, 10)) > twentyFourHours) {
                setShowReminder(true);
            }
        }
    };

    const dismissReminder = () => {
        setShowReminder(false);
        localStorage.setItem('lastReminderDismissedTimestamp', Date.now().toString());
    };

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

                try {
                    const me = await httpClient.get("/me");
                    if (me && me.success) {
                        setUser(me.user);
                        try {
                            const meta = { id: me.user?.id ?? null, lastSeen: Date.now() };
                            localStorage.setItem("user_meta", JSON.stringify(meta));
                            localStorage.removeItem("user_data");
                            localStorage.removeItem("user");
                        } catch (e) {
                            logger.error(e);
                        }
                        checkAndShowReminder(me.user);
                    } else {
                        setUser(data.user);
                        try {
                            const meta = { id: data.user?.id ?? null, lastSeen: Date.now() };
                            localStorage.setItem("user_meta", JSON.stringify(meta));
                            localStorage.removeItem("user_data");
                            localStorage.removeItem("user");
                        } catch (e) {}
                        checkAndShowReminder(data.user);
                    }
                } catch (err) {
                    setUser(data.user);
                    try { localStorage.setItem("user_meta", JSON.stringify({ id: data.user?.id ?? null, lastSeen: Date.now() })); localStorage.removeItem("user_data"); localStorage.removeItem("user"); } catch (e) {}
                    checkAndShowReminder(data.user);
                }

                // Retorna a 'role' para que a página de Login saiba para onde redirecionar
                return {
                    success: true,
                    role: data.user.role
                };
            }
            else {
                const msgErro = data.message || data.detail || "Credenciais inválidas.";
                return {
                    success: false,
                    message: msgErro
                };
            }

        } catch (error) {
            logger.error("Erro no login context:", error);
            const extractMessage = (data) => {
                if (!data) return null;
                if (typeof data === 'string') return data;
                if (Array.isArray(data)) {
                    try {
                        return data.map(d => (typeof d === 'string' ? d : (d.msg || JSON.stringify(d)))).join(' | ');
                    } catch (e) {
                        return String(data);
                    }
                }
                if (Array.isArray(data.detail)) {
                    return data.detail.map(d => (d.msg || JSON.stringify(d))).join(' | ');
                }
                if (data.message) return String(data.message);
                if (data.detail) return String(data.detail);
                return JSON.stringify(data);
            };

            const msg = extractMessage(error.data) || extractMessage(error.data?.detail) || "Erro de conexão.";
            return { success: false, message: msg };
        }
    };
    const logout = async () => {
        try {
            await httpClient.post("/logout", {});
        } catch (error) {
            logger.error("Erro ao fazer logout no servidor", error);
        } finally {
            setUser(null);
            try { localStorage.removeItem("user_meta"); localStorage.removeItem("user_data"); localStorage.removeItem("user"); } catch (e) {}
            window.location.href = "/";
        }
    };
    
    const isGestor = user?.role === "gestor";

    return (
        <AuthContext.Provider value={{ user, login, logout, isGestor, loading, showReminder, dismissReminder }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
    