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
    title: "Outros",
    items: [
      { to: "/settings", label: "Configurações", icon: BsChatDotsFill },
      { to: "/records", label: "Registros", icon: BsFileEarmarkText },
    ],
  },
];

