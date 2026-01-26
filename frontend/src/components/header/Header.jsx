import { useAuth } from "../../context/authContext";
import UserButton from "../user_button/UserButton";
import Reminder from "./Reminder";


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