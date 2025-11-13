import Header from "../components/header/Header"
import Navbar from "../components/nav_bar/NavBar"

export default function ListUsers(){
    return (
    <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col gap-6">
                    {/* Alterar quando usar useContext */}
                    <Header pageTitle={"Configurações"} userName={"Dionatas"} />
                    <section>
                        {/* Conteúdo da lista de usuários aqui */}
                    </section>
                </div>
            </main>
        </div>
    )
}