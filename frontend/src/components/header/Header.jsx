import { Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import UserButton from "../user_button/UserButton";

const Reminder = () => {
    return (
        <div className="group relative flex items-center z-10">
            {/* Botão circular vermelho com ícone */}
            <Link
                to="/orders"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f43629] animate-pulse"
                aria-label="Lembrete! Importar pedidos."
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </Link>

            {/* Texto rolando no hover */}
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-fit hidden group-hover:block z-50">
                <div className="marquee rounded bg-white px-3 py-1 text-sm font-semibold text-[#031933] shadow-lg whitespace-nowrap">
                    <span>Lembrete! Importar pedidos.</span>
                </div>
            </div>

        </div>
    );
};


export default function Header({ pageTitle, userName }) {
    const { showReminder } = useAuth();

    return (
        <header className="flex justify-between items-center w-full p-5 pl-20 border-b-2">
            <span className="text-[#F384C] text-xl font-semibold">{pageTitle}</span>
            <div className="flex items-center gap-4">
                {showReminder && <Reminder />}
                <UserButton user_name={userName} />
            </div>
        </header>
    )
}