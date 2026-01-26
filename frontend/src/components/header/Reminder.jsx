import { Link } from "react-router-dom";

export default function Reminder() {
    return (
        <div className="group relative flex items-center z-10">
            <Link
                to="/orders"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f43629] animate-pulse"
                aria-label="Lembrete! Importar pedidos."
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </Link>
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-fit hidden group-hover:block z-50">
                <div className="marquee rounded bg-white px-3 py-1 text-sm font-semibold text-[#031933] shadow-lg whitespace-nowrap">
                    <span>Lembrete! Importar pedidos.</span>
                </div>
            </div>
        </div>
    );
}
