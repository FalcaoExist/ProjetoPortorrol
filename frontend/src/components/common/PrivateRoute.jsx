import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/authContext"; 

export default function PrivateRoute({ children, allowedRoles, onlyGestor = false }) {
    const { user, loading, isGestor } = useAuth();

 
    if (loading) {
        return <div className="h-screen flex items-center justify-center font-poppins">Carregando sessão...</div>; 
    }

    if (!user) {
        return <Navigate to="/" />;
    }

    if (onlyGestor && !isGestor) {
        return <Navigate to="/list_suppliers" replace />;
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const hasRequiredRole = allowedRoles.includes(user.role);
        if (!hasRequiredRole) {
            return <Navigate to="/home" replace />;
        }
    }

    return children;
}