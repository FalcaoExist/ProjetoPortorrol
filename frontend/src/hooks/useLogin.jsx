import { useState, useCallback } from "react";

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
      setErrors({});
      setLoading(true);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        // Verifica se a resposta tem conteúdo antes de fazer parse
        let data;
        const contentType = res.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } else {
          // Se não for JSON, trata como erro
          clearForm();
          setErrors({ form: "Erro no servidor. Resposta inválida." });
          return;
        }

        // Tratamento de erros específicos
        if (!res.ok) {
          // Limpa os campos após erro
          clearForm();
          
          if (res.status === 403) {
            // Usuário desativado
            setErrors({ 
              form: data.detail || "Este usuário está desativado. Contate o administrador." 
            });
          } else if (res.status === 401) {
            // Credenciais inválidas
            setErrors({ 
              form: data.detail || "E-mail ou senha inválidos" 
            });
          } else {
            // Outros erros
            setErrors({ 
              form: data.detail || "Erro ao realizar login. Tente novamente." 
            });
          }
          return;
        }

        // Login bem-sucedido
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
        
        // Mensagem mais específica baseada no erro
        if (err.name === "SyntaxError") {
          setErrors({ form: "Erro no servidor. Resposta inválida." });
        } else if (err.message.includes("fetch")) {
          setErrors({ form: "Erro ao conectar com o servidor. Verifique se o backend está rodando." });
        } else {
          setErrors({ form: "Erro ao conectar com o servidor" });
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password]
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