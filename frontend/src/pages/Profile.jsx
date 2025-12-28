import Navbar from "../components/nav_bar/NavBar";
import Header from "../components/header/Header";
import { useAuth } from "../context/authContext";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import ChangePasswordSection from "../components/change_password_section/ChangePasswordSection";

export default function Profile() {
    const { user } = useAuth();
    const userId = user?.user_id || user?.id || user?.userId;

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />
            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Configurações"} userName={user?.name || "Usuário"} />
                    <UserProfileSummary
                        role={user?.role || "Visitante"}
                        userName={user?.name || "..."}
                        userEmail={user?.email || "..."}
                    />
                    <ChangePasswordSection userId={userId} userName={user?.name} />
                </div>
            </main>
        </div>
    );
}
