export function validateLogin({ email, password }) {
	const errors = {};

	if (!email || typeof email !== 'string') {
		errors.email = 'Email é obrigatório';
	} else {
		// crude email test
		const re = /\S+@\S+\.\S+/;
		if (!re.test(email)) errors.email = 'Email inválido';
	}

	if (!password || typeof password !== 'string') {
		errors.password = 'Senha é obrigatória';
	} else if (password.length < 3) {
		errors.password = 'Senha muito curta';
	}

	return { isValid: Object.keys(errors).length === 0, errors };
}

