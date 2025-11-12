import { useState, useCallback } from "react";
// 1. Importe sua função de validação
// (Caminho corrigido para './' assumindo que o validador está na mesma pasta 'hooks')
import { validateLogin } from "../services/validators/loginValidator.js";  

export default function useLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onEmailChange = (e) => setEmail(e.target.value);
  const onPasswordChange = (e) => setPassword(e.target.value);

  const clearForm = () => {
    setEmail("");
    setPassword("");
  };

  const submit = useCallback(
    async (e, navigate) => {
      e?.preventDefault?.();
      setErrors({}); // Limpa erros antigos

      // 2. Execute a validação do front-end PRIMEIRO
      const { isValid, errors: validationErrors } = validateLogin({
        email,
        password,
      });

      // 3. Se não for válido, defina os erros e pare a execução
      if (!isValid) {
        setErrors(validationErrors);
        return; // Não continua para o fetch
      }

      // 4. Se for válido, prossiga com o login
      setLoading(true);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        let data;
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } else {
          clearForm();
          setErrors({ form: "Erro no servidor. Resposta inválida." });
          return;
        }

        if (!res.ok) {
          clearForm();
          if (res.status === 403) {
            setErrors({
              form:
                data.detail ||
                "Este usuário está desativado. Contate o administrador.",
            });
          } else if (res.status === 401) {
            setErrors({
              form: data.detail || "E-mail ou senha inválidos",
            });
          } else {
            setErrors({
              form: data.detail || "Erro ao realizar login. Tente novamente.",
            });
          }
          return;
        }

        if (data.success && data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/home");
        } else {
          clearForm();
          setErrors({ form: "Erro ao realizar login" });
        }
      } catch (err) {
        clearForm();
        console.error("Erro no login:", err);

        if (err.name === "SyntaxError") {
          setErrors({ form: "Erro no servidor. Resposta inválida." });
        } else if (err.message.includes("fetch")) {
          setErrors({
            form: "Erro ao conectar com o servidor. Verifique se o backend está rodando.",
          });
        } else {
          setErrors({ form: "Erro ao conectar com o servidor" });
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password] // 'navigate' é passado como argumento, não precisa estar aqui
  );

  return {
    email,
    password,
    onEmailChange,
    onPasswordChange,
    submit,
    loading,
    errors,
    clearForm,
  };
}