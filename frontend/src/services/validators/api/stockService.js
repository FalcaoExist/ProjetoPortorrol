const stockService = {
    // Agora aceita 'token' como segundo parâmetro
    async importCSV(file, token) {
        const formData = new FormData();
        formData.append("file", file);

        // Prepara os headers
        const headers = {};
        
        // Se o token existir (usuário logado), anexa no cabeçalho
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch nativo para evitar erro 422 de Boundary
        const response = await fetch("http://localhost:8000/stock/import", {
            method: "POST",
            headers: headers, // <--- Aqui vai o Token
            body: formData,
        });

        const data = await response.json();

        // Tratamento de erro padrão
        if (!response.ok) {
            const error = new Error("Erro na requisição");
            error.response = {
                status: response.status,
                data: data
            };
            throw error;
        }

        return data;
    },

    async list() {
        const response = await fetch("http://localhost:8000/stock");
        return response.json();
    }
};

export default stockService;