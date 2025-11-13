import { useState, useEffect } from "react";
import { BsPersonCircle } from "react-icons/bs";
import { Link } from "react-router-dom";
export default function({user_name}){
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={toggleDropdown}
          className="inline-flex justify-center items-center gap-2 w-full rounded-full border border-gray-300 shadow-sm px-16 py-2 bg-[#756B9B] text-lg  text-white font-semibold hover:bg-primary focus:outline-none "
          id="menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
            
          Olá, {user_name}!
          <BsPersonCircle size={"1.6em"}/>
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex="-1"
        >
          <div className="py-1" role="none">
            {/* Itens do Menu */}
            <Link to="/profile" className={"text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"}>Minha Conta</Link>
          </div>
          <div className="py-1">
            <Link to="/logout" className={"text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"}>Logout</Link>
          </div>
        </div>
      )}
    </div>
  );
}