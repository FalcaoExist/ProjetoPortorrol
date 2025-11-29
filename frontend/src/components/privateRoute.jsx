import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function PrivateRoute({ children, onlyGestor = false }) {
    const { user, loading, isGestor } = useAuth();

    if (loading) {
        return <div className="p-10 text-center font-poppins">Carregando...</div>; 
    }

    // 1. Se não estiver logado, manda para o Login
    if (!user) {
        return <Navigate to="/" />;
    }

    // 2. [SEGURANÇA] Se a rota for só para Gestor e o usuário NÃO for gestor
    // Redireciona para a tela permitida (Fornecedores)
    if (onlyGestor && !isGestor) {
        return <Navigate to="/list_suppliers" replace />;
    }

    // Se passou nas verificações, renderiza a página
    return children;
}