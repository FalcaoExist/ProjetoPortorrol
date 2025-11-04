import { useState, useCallback } from 'react';
import { validateLogin } from '../services/validators/loginValidator.js';

export default function useLogin() {

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);

	const onEmailChange = useCallback((e) => setEmail(e.target.value), []);
	const onPasswordChange = useCallback((e) => setPassword(e.target.value), []);

	const submit = useCallback(async (e) => {
		e?.preventDefault?.();
		const validation = validateLogin({ email, password });
		setErrors(validation.errors);
		if (!validation.isValid) return;

		setLoading(true);
		// Comunicacao com o back-end
		try {
			const data = ""
			setResult(data);
		} catch (err) {
			setErrors({ form: err?.message || 'Falha no login' });
		} finally {
			setLoading(false);
		}
	}, [ email, password]);

	return {
		email,
		password,
		onEmailChange,
		onPasswordChange,
		submit,
		loading,
		errors,
		result,
	};
}

