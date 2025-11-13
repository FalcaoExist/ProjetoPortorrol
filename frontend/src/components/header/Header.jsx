import UserButton from "../user_button/UserButton"
export default function Header({page_title}){
    return (
        <header>
            <span>{page_title}</span>
            <UserButton user_name={"Jorge"}/>
        </header>
    )
}