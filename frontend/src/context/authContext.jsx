import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // -------------------------------------------------------------------------
    // AO CARREGAR A PÁGINA: Recupera sessão
    // -------------------------------------------------------------------------
    useEffect(() => {
        const storedUser = localStorage.getItem("user_data");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Erro ao ler dados do usuário:", e);
                localStorage.removeItem("user_data"); // Limpa se estiver corrompido
            }
        }
        setLoading(false);
    }, []);

    // -------------------------------------------------------------------------
    // LOGIN
    // -------------------------------------------------------------------------
    const login = async (email, password) => {
        try {
            // Faz a requisição ao backend
            const response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            // CASO 1: Backend retornou SUCESSO
            if (data.success) {
                // Verificação de segurança extra no Frontend (dupla checagem)
                if (data.user?.is_active === false) {
                    return { 
                        success: false, 
                        message: "Acesso negado: Sua conta está desativada." 
                    };
                }

                // Salva o usuário no estado e no localStorage
                setUser(data.user);
                localStorage.setItem("user_data", JSON.stringify(data.user));
                
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
            console.error("Erro no login:", error);
            return { success: false, message: "Erro de conexão com o servidor." };
        }
    };

    // -------------------------------------------------------------------------
    // LOGOUT
    // -------------------------------------------------------------------------
    const logout = () => {
        setUser(null);
        localStorage.removeItem("user_data");
        // Redireciona forçado para a raiz (login)
        window.location.href = "/";
    };

    // Helper para verificar permissão facilmente nos componentes
    const isGestor = user?.role === "gestor";

    return (
        <AuthContext.Provider value={{ user, login, logout, isGestor, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);