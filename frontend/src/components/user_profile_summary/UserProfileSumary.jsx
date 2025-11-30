import { BiUser } from "react-icons/bi";

export default function UserProfileSummary({role="", userName, userEmail}){
    return (
        <div className="grid grid-flow-col grid-rows-2 gap-x-3 justify-start p-20">
            <BiUser size="45px" className="row-span-3"/>
            {role ? <strong className="font-poppins capitalize">{role}</strong> : null}
            <p className="font-poppins text-lg">{userName}</p>
            <p className="font-poppins text-[#9e9e9e]">{userEmail}</p>
        </div>
    )
}