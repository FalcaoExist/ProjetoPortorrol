import logoIby from '../assets/logoIby_maior.png'
import background from '../assets/background.png'
import LoginForm from "../components/login/LoginForm"
import useLogin from "../hooks/useLogin.jsx";

export default function Login(){
    const { email, password, onEmailChange, onPasswordChange, submit, loading, errors, result } = useLogin();

    return (
            <div
                className="w-screen flex h-screen justify-center bg-cover bg-bottom"
                style={{ backgroundImage: `url(${background})` }}
            >
                <div className="max-w-sm w-full p-4">
                    <LoginForm 
                        onSubmit={submit} 
                        logo={logoIby}
                        email={email} 
                        onEmailChange={onEmailChange} 
                        password={password} 
                        onPasswordChange={onPasswordChange}
                        errors={errors}
                    />
                    {errors?.form && (
                        <p className="text-red-600 mt-3 text-center">{errors.form}</p>
                    )}
                    {loading && (
                        <p className="text-gray-600 mt-3 text-center">Entrando…</p>
                    )}
                    {result?.user && (
                        <p className="text-green-700 mt-3 text-center">Olá, {result.user.name || result.user.email}</p>
                    )}
                </div>
            </div>
    )
}