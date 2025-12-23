/**
 * Traduz erros técnicos da API para mensagens amigáveis ao usuário.
 * @param {Error} error - O objeto de erro capturado no catch
 * @returns {string} - A mensagem pronta para ser exibida no alert/toast
 */

export const traduzirErroUpload = (error) => {

    // 1. Sem conexão

    if (!error.response) {

        return " Sem conexão com o servidor.";

    }



    const { status, data } = error.response;

    

    // Tenta pegar o texto do erro, seja string ou objeto

    let detalheTecnico = "";

    if (data && data.detail) {

        detalheTecnico = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);

    }



    // --- ZONA DE TRADUÇÃO (Adicione aqui frases comuns do Python) ---

    if (detalheTecnico.includes("No columns to parse")) {

        return " O arquivo parece estar vazio ou sem cabeçalho válido.";

    }

    if (detalheTecnico.includes("utf-8") || detalheTecnico.includes("decode")) {

        return " Erro de formatação: Salve seu CSV com codificação UTF-8.";

    }

    if (detalheTecnico.includes("Excel")) {

        return " Formato de Excel inválido ou corrompido.";

    }

    if (detalheTecnico.includes("Duplicate")) {

        return " Dados duplicados encontrados.";

    }



    // --- TRATAMENTO POR CÓDIGO DE STATUS ---



    // Erro 422: Validação (Lógica do nosso backend)

    if (status === 422) {

        // Se for a nossa lista de erros customizada

        if (data.detail && data.detail.erros) {

            return ` O arquivo contém erros:\n\n${data.detail.erros.slice(0, 5).join("\n")}`;

        }

        // Se for 422 genérico, não mostre o inglês. Invente um texto.

        return " O arquivo não está no formato correto exigido pelo sistema.";

    }



    // Erro 400: Requisição ruim

    if (status === 400) {

        return " O arquivo enviado é inválido ou está corrompido.";

    }



    // Erro 500: Servidor

    if (status >= 500) {

        return " Erro interno no servidor. Tente novamente mais tarde.";

    



    // --- FALLBACK FINAL (A BLINDAGEM) ---

    // Se chegou aqui, é um erro que não mapeamos. 

    // Em vez de mostrar o inglês (detalheTecnico), mostramos isso:

    return ` Erro desconhecido (${status}). Verifique se o arquivo está correto.`;

}; 
}