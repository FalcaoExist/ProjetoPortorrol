// Mock data para a tabela de estoque
export const initialStockData = [
    { id: 1, codigo: "ROL-001", item: "ANel FRB 100/11,5", categoria: "Rolamento x", unidades: 150, fornecedor: "NSK", filial: "Porto Alegre", dias_cobertura: 25 },
    { id: 2, codigo: "ROL-002", item: "ANel FRB 100/11,5", categoria: "Rolamento x", unidades: 80, fornecedor: "Timken", filial: "Joinville", dias_cobertura: 45 },
    { id: 3, codigo: "RET-001", item: "ANel FRB 100/11,5", categoria: "Rolamento x", unidades: 300, fornecedor: "FRM", filial: "São Paulo", dias_cobertura: 75 },
    { id: 4, codigo: "RET-002", item: "ARRUELA BGL MB 11", categoria: "Arruela", unidades: 100, fornecedor: "BGL", filial: "Porto Alegre", dias_cobertura: 60 },
    { id: 5, codigo: "RET-003", item: "BUCHA BGL AHX 3122", categoria: "Bucha", unidades: 50, fornecedor: "BGL", filial: "Joinville", dias_cobertura: 30 },
];

// Opções para os filtros
export const statusOptions = ["OK", "Subdimensionado", "Ruptura iminente", "Excesso"];
export const fornecedorOptions = ["NSK", "Timken", "FRM", "BGL", "IKO", "SAV"];
export const filialOptions = ["Porto Alegre", "Joinville", "São Paulo"];
