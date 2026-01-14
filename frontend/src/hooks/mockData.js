// Mock data para a tabela de estoque
export const initialStockData = [
    { id: 1, codigo: "FRB 100/11,5", item: "ANEL FRB 100/11,5", categoria: "Silver", unidades: 150, fornecedor: "NSK", filial: "Porto Alegre", dias_cobertura: 25 },
    { id: 2, codigo: "ZW 75/85", item: "ANEL DE BLOQUEIO ZW 75/85", categoria: "Gold", unidades: 80, fornecedor: "Timken", filial: "Joinville", dias_cobertura: 45 },
    { id: 3, codigo: "FRB 100/4", item: "ANEL FRB 100/4", categoria: "Regular", unidades: 300, fornecedor: "FRM", filial: "São Paulo", dias_cobertura: 75 },
    { id: 4, codigo: "MB 11 A", item: "ARRUELA BGL MB 11", categoria: "Regular", unidades: 100, fornecedor: "BGL", filial: "Porto Alegre", dias_cobertura: 60 },
    { id: 5, codigo: "MB 11", item: "BUCHA BGL AHX 3122", categoria: "Bucha", unidades: 50, fornecedor: "BGL", filial: "Joinville", dias_cobertura: 30 },
    { id: 6, codigo: "H 204", item: "BUCHA BGL H 204", categoria: "Silver", unidades: 150, fornecedor: "NSK", filial: "Porto Alegre", dias_cobertura: 15 },
    { id: 7, codigo: "H 3122", item: "BUCHA BGL H 3122", categoria: "Gold", unidades: 80, fornecedor: "Timken", filial: "Joinville", dias_cobertura: 110 },
    { id: 8, codigo: "19268", item: "CAPA TIMKEN 19268 2", categoria: "Regular", unidades: 300, fornecedor: "Timken", filial: "São Paulo", dias_cobertura: 37 },
    { id: 9, codigo: "F 205", item: "MANCAL FRM F 205", categoria: "Regular", unidades: 100, fornecedor: "FRM", filial: "Porto Alegre", dias_cobertura: 92 },
    { id: 10, codigo: "KM 13", item: "PORCA BGL KM 13", categoria: "Silver", unidades: 50, fornecedor: "BGL", filial: "Joinville", dias_cobertura: 40 },
];

// Opções para os filtros
export const statusOptions = ["OK", "Subdimensionado", "Ruptura iminente", "Excesso"];
export const fornecedorOptions = ["NSK", "Timken", "FRM", "BGL", "IKO", "SAV"];
export const filialOptions = ["Porto Alegre", "Joinville", "São Paulo"];
