
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <p className="text-gray-500 font-poppins">Carregando...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" />;
    }
    
    return children;
}