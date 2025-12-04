import UserButton from "../user_button/UserButton"
export default function Header({pageTitle, userName}){
    return (
        <header className="flex justify-between items-center w-full p-5 pl-20 border-b-2">
            <span className="text-[#1F384C] text-xl font-semibold">{pageTitle}</span>
            <UserButton user_name={userName}/>
        </header>
    )
}