import NavTittle from "./NavTitle"
import logoIby_maior from "../../assets/logoIby_maior.png"
import {Link} from "react-router-dom"
export default function Navbar(){
    return (
        <nav>
            <img src={logoIby_maior} alt="logo_iby" />
        </nav>
    )
}