import { BsFileBarGraphFill, BsCart2, BsFileTextFill, BsChatDotsFill, BsFileEarmarkText } from "react-icons/bs";

export const defaultSections = [
  {
    title: "Menu",
    items: [
      { to: "/home", label: "Dashboard", icon: BsFileBarGraphFill },
      { to: "/orders", label: "Pedidos", icon: BsCart2 },
      { to: "/stock", label: "Estoque", icon: BsFileTextFill },
    ],
  },
  {
    title: "Gerenciar",
    requiresGestor: true,
    items: [
      // Apenas gestor vê "Comprador"
      { to: "/list_users", label: "Comprador", icon: BsChatDotsFill, onlyGestor: true },
      
      // Todos veem "Fornecedores" (se quiser restringir, adicione onlyGestor: true aqui também)
      { to: "/list_suppliers", label: "Fornecedores", icon: BsFileEarmarkText },
      
      // [ALTERADO] Agora apenas gestor vê "Registros"
      { to: "/records", label: "Registros", icon: BsFileEarmarkText, onlyGestor: true },
    ],
  },
];