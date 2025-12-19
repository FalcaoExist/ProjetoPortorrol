import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoIby from '../assets/logoIby_maior.png'
import background from '../assets/background.png'
import LoginForm from "../components/login/LoginForm"
import useLogin from "../hooks/useLogin.jsx";

import { useAuth } from "../context/authContext"; 

export default function Login() {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth(); 
    const { email, password, onEmailChange, onPasswordChange, errors: hookErrors } = useLogin();
    const [localLoading, setLocalLoading] = useState(false);
    const [loginError, setLoginError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalLoading(true);
        setLoginError("");

        try {
            const result = await authLogin(email, password);

            if (result.success) {
                // Redirecionamento baseado no cargo (Role Based Redirection)
                if (result.role === "gestor") {
                    navigate("/list_users");      // Gestor -> Gerenciar Compradores
                } else {
                    navigate("/list_suppliers");  // Comprador -> Lista de Fornecedores
                }
            } else {
                setLoginError(result.message);
            }
        } catch (error) {
            console.error("Erro inesperado no login:", error);
            setLoginError("Erro inesperado. Tente novamente.");
        } finally {
            setLocalLoading(false);
        }
    };

    const displayError = hookErrors?.form || loginError;

    return (
        <div
            className="w-screen flex h-screen justify-center items-center bg-cover bg-bottom"
            style={{ backgroundImage: `url(${background})` }}
        >
            <div className="max-w-sm w-full p-6 bg-white bg-opacity-95 rounded-2xl shadow-2xl">
                <LoginForm 
                    onSubmit={handleSubmit} 
                    logo={logoIby}
                    email={email} 
                    onEmailChange={onEmailChange} 
                    password={password} 
                    onPasswordChange={onPasswordChange}
                    errors={hookErrors} 
                    loading={localLoading}
                />
                
                {displayError && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center animate-pulse">
                        <p className="text-sm font-poppins">{displayError}</p>
                    </div>
                )}
                
                {localLoading && (
                    <div className="mt-4 text-center">
                        <p className="text-gray-600 text-sm font-poppins">Entrando no sistema...</p>
                    </div>
                )}
            </div>
        </div>
    )
}