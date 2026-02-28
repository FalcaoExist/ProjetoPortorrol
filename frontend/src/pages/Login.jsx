import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoIby from '../assets/logoIby_maior.png'
import logoPort from '../assets/LogoPort.png'
import background from '../assets/Paginicial.png'
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
                navigate("/home")
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
                    logo={logoPort}
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

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-[0.6rem] text-gray-500 font-poppins">Desenvolvido por IBy</span>
                <img src={logoIby} alt="IBy Logo" className="w-16 mt-1" />
            </div>
        </div>
    )
}