/**
 * Traduz erros técnicos da API para mensagens amigáveis ao usuário.
 * @param {Error} error - O objeto de erro capturado no catch
 * @returns {string} - A mensagem pronta para ser exibida no alert/toast
 */

export const traduzirErroUpload = (error) => {
    if (!error.response) {
        return " Sem conexão com o servidor.";
    }

    const { status, data } = error.response;

    let detalheTecnico = "";

    if (data && data.detail) {

        detalheTecnico = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);

    }

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

    if (status === 422) {

        if (data.detail && data.detail.erros) {

            return ` O arquivo contém erros:\n\n${data.detail.erros.slice(0, 5).join("\n")}`;

        }

        return " O arquivo não está no formato correto exigido pelo sistema.";

    }

    if (status === 400) {

        return " O arquivo enviado é inválido ou está corrompido.";

    }
    if (status >= 500) {
        return " Erro interno no servidor. Tente novamente mais tarde.";
    }

    return ` Erro desconhecido (${status}). Verifique se o arquivo está correto.`;
};
