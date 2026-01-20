import { exportStockCSV } from "./csvExporter";

export const importStockFromFile = async (file) => {
    if (!file) {
        throw new Error("Nenhum arquivo fornecido.");
    }

    console.log(`Iniciando importação do arquivo: ${file.name}`);

    
    return new Promise(resolve => {
        setTimeout(() => {
            console.log("Arquivo processado com sucesso (simulado).");
            // Em um caso real, retornaria os dados do arquivo aqui
            resolve({
                message: `Arquivo ${file.name} importado com sucesso.`,
                // data: parsedData
            });
        }, 1000);
    });
};


export const exportStockData = async (data) => {
    if (!data || data.length === 0) {
        throw new Error("Nenhum dado fornecido para exportação.");
    }

    exportStockCSV(data);

    return Promise.resolve({ message: "Dados do estoque exportados e download iniciado." });
};
