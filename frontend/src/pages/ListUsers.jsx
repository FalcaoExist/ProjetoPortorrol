import Header from "../components/header/Header"
import Navbar from "../components/nav_bar/NavBar"
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary"
import UsersTable from "../components/users_table/UsersTable"

export default function ListUsers(){
    return (
    <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    {/* Alterar quando usar useContext */}
                    <Header pageTitle={"Configurações"} userName={"Dionatas"} />
                    <UserProfileSummary role="Gestor" userName={"Dionatas Terres"} userEmail={"dionatas.terres@portorrol.com"}/>
                    <section className="xl:pr-48 pl-20 md:px-20">
                        <UsersTable users={[]}/>
                        <button to="" className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md mt-6"> Adicionar Comprador</button>
                    </section>
                </div>
            </main>
        </div>
    )
}