import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import SuppliersTable from "../components/suppliers_table/SuppliersTable";

export default function ListSuppliers() {
    // const [openModal, setOpenModal] = useState(false);

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Configurações"} userName={"Dionatas"} />
                    
                    <UserProfileSummary 
                        role="Gestor" 
                        userName={"Dionatas Terres"} 
                        userEmail={"dionatas.terres@portorrol.com"} 
                    />

                    <section className="xl:pr-48 pl-20 md:px-20">
                        <SuppliersTable />
                    </section>
                </div>
            </main> 
        </div>
    );
}
