import React, { useState } from "react";
import { BsEye, BsEyeSlash } from "react-icons/bs";

export default function LoginForm({
  logo,
  onSubmit,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  loading,
  errors, // 1. Receba o objeto de erros completo
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <form
      noValidate // Desabilita a validação HTML padrão
      onSubmit={onSubmit}
      className="flex flex-col items-center justify-center w-full"
    >
      <img src={logo} alt="logo" className="mb-6 w-32 h-auto" />

      <div className="flex flex-col justify-center w-full mb-4">
        <label
          htmlFor="email"
          className="text-center mb-2 font-poppins text-[#273240] text-sm sm:text-base md:text-lg"
        >
          Insira seu email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          // 2. Adiciona classe de erro condicionalmente
          className={`h-10 md:h-12 border-2 rounded-lg px-4 py-2 text-sm md:text-base font-poppins focus:outline-none focus:border-primary transition-colors ${
            errors?.email ? "border-red-500" : "border-gray-300"
          }`}
          value={email}
          onChange={onEmailChange}
          disabled={loading}
          required
          autoComplete="email"
        />
        {/* 3. Exibe a mensagem de erro específica para o email */}
        {errors?.email && (
          <p className="mt-1 text-sm text-red-600 font-poppins text-center">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col justify-center w-full mb-6 relative">
        <label
          htmlFor="password"
          className="text-center mb-2 font-poppins text-sm sm:text-base md:text-lg text-[#273240]"
        >
          Insira sua senha
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            // 2. Adiciona classe de erro condicionalmente
            className={`h-10 md:h-12 border-2 rounded-lg px-4 pr-10 py-2 w-full text-sm md:text-base font-poppins focus:outline-none focus:border-primary transition-colors ${
              errors?.password ? "border-red-500" : "border-gray-300"
            }`}
            value={password}
            onChange={onPasswordChange}
            disabled={loading}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
            tabIndex={-1} // evita focar no botão ao pressionar Tab
          >
            {showPassword ? (
              <BsEyeSlash size={20} />
            ) : (
              <BsEye size={20} />
            )}
          </button>
        </div>
        
        {/* 3. Exibe a mensagem de erro específica para a senha */}
        {errors?.password && (
          <p className="mt-1 text-sm text-red-600 font-poppins text-center">
            {errors.password}
          </p>
        )}
      </div>

      <div className="flex justify-center w-full">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-opacity-90 active:bg-secondary border-2 border-primary px-8 py-3 w-full max-w-xs rounded-xl text-base md:text-lg text-white font-poppins transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </form>
  );
}