import { useNavigate } from "react-router-dom";
import logoIby from '../assets/logoIby_maior.png'
import background from '../assets/background.png'
import LoginForm from "../components/login/LoginForm"
import useLogin from "../hooks/useLogin.jsx";

export default function Login(){
    const navigate = useNavigate();
    const { email, password, onEmailChange, onPasswordChange, submit, loading, errors } = useLogin();

    const handleSubmit = (e) => {
        submit(e, navigate);
    };

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
                    errors={errors}
                    loading={loading}
                />
                
                {/* Mensagem de erro genérica */}
                {errors?.form && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                        <p className="text-sm font-poppins">{errors.form}</p>
                    </div>
                )}
                
                {/* Indicador de carregamento */}
                {loading && (
                    <div className="mt-4 text-center">
                        <p className="text-gray-600 text-sm font-poppins">Verificando credenciais...</p>
                    </div>
                )}
            </div>
        </div>
    )
}