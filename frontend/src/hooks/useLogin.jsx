import { useState, useCallback } from "react";
import { useAuth } from "../context/authContext"; 
import { validateLogin } from "../services/validators/loginValidator.js"; 
import { logger } from "../utils/logger";

export default function useLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  

  const { login: contextLogin } = useAuth();

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

      const { isValid, errors: validationErrors } = validateLogin({
        email,
        password,
      });

      if (!isValid) {
        setErrors(validationErrors);
        return;
      }

      setLoading(true);

      try {
        const result = await contextLogin(email, password);

        if (result.success) {
            navigate("/home");
        } else {
            setErrors({ form: result.message });
        }

      } catch (err) {
        setErrors({ form: "Ocorreu um erro inesperado." });
        logger.error(err);
      } finally {
        setLoading(false);
      }
    },
    [email, password, contextLogin]
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