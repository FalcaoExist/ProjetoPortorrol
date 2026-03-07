const stockService = {
    async importCSV(file, token) {
        const formData = new FormData();
        formData.append("file", file);

        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(`${API_URL}/stock/import`, {
            method: "POST",
            headers: headers,
            body: formData,
        });

        const data = await response.json();

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
        const response = await fetch(`${API_URL}/stock`);
        return response.json();
    }
};

export default stockService;