import React from "react";
import NavItem from "./NavItem";
import logoIby_maior from "../../assets/logoIby_maior.png";
import { Link } from "react-router-dom";
import { defaultSections as defaultSectionsConfig } from "./navConfig";

import { useAuth } from "../../context/authContext";

export default function Navbar({
    sections = defaultSectionsConfig,
    logoSrc = logoIby_maior,
} = {}) {
    const { logout, isGestor } = useAuth();

    // Limitar visibilidade das opções
    const visibleSections = sections
        ?.map((section) => {
            if ((section.requiresGestor || section.onlyGestor) && !isGestor) {
                return null;
            }

            const visibleItems = section.items?.filter((item) => {
                if ((item.requiresGestor || item.onlyGestor) && !isGestor) {
                    return false;
                }
                return true;
            }) ?? [];

            if (visibleItems.length === 0) {
                return null;
            }

            return { ...section, items: visibleItems };
        })
        .filter(Boolean);

    return (
        <aside className={`sticky top-0 h-screen w-64 bg-[#F1F2F7] border-r shadow-sm p-4 flex flex-col self-start`}>
            <img src={logoSrc} alt="logo" className="w-50 mb-4" />

            <nav className={"flex flex-col mt-4"}>
                {visibleSections?.map((section, sectionIndex) => (
                    <React.Fragment
                        key={section.id || section.title || `section-${sectionIndex}`}
                    >
                        {section.title ? (
                            <span className="text-[#082431] text-sm tracking-widest self-start font-poppins mb-2 ml-8 block">{section.title}</span>
                        ) : null}
                        <ul
                            className="flex flex-col gap-y-2 pl-9 items-start"
                            key={section.id || section.title || `section-${sectionIndex}`}
                        >
                            {section.items?.map((item, i) => {
                                // [NOVA LÓGICA] 
                                // Se o item requer gestor e o usuário não é gestor, não renderiza o botão no menu.
                                if ((item.onlyGestor || item.requiresGestor) && !isGestor) {
                                    return null;
                                }

                                return (
                                    <NavItem
                                        key={`${section.title || "sec"}-${i}`}
                                        to={item.to}
                                        label={item.label}
                                        Icon={item.icon}
                                        LinkComponent={Link}
                                    />
                                );
                            })}
                        </ul>
                    </React.Fragment>

                ))}

                {/* Botão de sair */}
                <button 
                    onClick={logout} 
                    className="text-sm tracking-widest self-start font-poppins mt-2 ml-8 block text-left hover:text-red-600 transition-colors"
                >
                    Sair
                </button>
            </nav>
        </aside>
    );
}