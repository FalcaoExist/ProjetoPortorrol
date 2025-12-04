import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Recupera o usuário do localStorage ao carregar a página
    useEffect(() => {
        const storedUser = localStorage.getItem("user_data");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            // CASO 1: Backend disse que foi SUCESSO
            if (data.success) {
                // Verificação de segurança extra no Frontend
                if (data.user?.is_active === false) {
                    return { 
                        success: false, 
                        message: "Acesso negado: Sua conta está desativada." 
                    };
                }

                setUser(data.user);
                localStorage.setItem("user_data", JSON.stringify(data.user));
                
                // [IMPORTANTE] Retorna a role para o Login.jsx saber pra onde redirecionar
                return { 
                    success: true, 
                    role: data.user.role 
                };
            } 
            
            // CASO 2: Backend disse que foi ERRO
            else {
                const msgErro = data.message || data.detail || "Credenciais inválidas.";
                return { 
                    success: false, 
                    message: msgErro 
                };
            }

        } catch (error) {
            console.error("Erro no login:", error);
            return { success: false, message: "Erro de conexão com o servidor." };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user_data");
        window.location.href = "/";
    };

    const isGestor = user?.role === "gestor";

    return (
        <AuthContext.Provider value={{ user, login, logout, isGestor, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);