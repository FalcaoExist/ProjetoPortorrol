import { BsFileBarGraphFill, BsCart2, BsFileTextFill, BsChatDotsFill, BsFileEarmarkText } from "react-icons/bs";

export const defaultSections = [
  {
    title: "Menu",
    items: [
      { to: "/", label: "Dashboard", icon: BsFileBarGraphFill },
      { to: "/orders", label: "Pedidos", icon: BsCart2 },
      { to: "/stock", label: "Estoque", icon: BsFileTextFill },
    ],
  },
  {
    title: "Gerenciar",
    requiresGestor: true,
    items: [
      { to: "/list_users", label: "Comprador", icon: BsChatDotsFill },
      { to: "/list_suppliers", label: "Fornecedores", icon: BsFileEarmarkText },
      { to: "/records", label: "Registros", icon: BsFileEarmarkText },
    ],
  },
];

