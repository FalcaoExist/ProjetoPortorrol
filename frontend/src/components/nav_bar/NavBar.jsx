import React from "react";
import NavItem from "./NavItem";
import logoIby_maior from "../../assets/logoIby_maior.png";
import { Link } from "react-router-dom";
import { defaultSections as defaultSectionsConfig } from "./navConfig";

export default function Navbar({
    sections = defaultSectionsConfig,
    logoSrc = logoIby_maior,
} = {}) {
    return (
        <aside className={`sticky top-0 h-screen w-64 bg-[#F1F2F7] border-r shadow-sm p-4 flex flex-col self-start`}>
            <img src={logoSrc} alt="logo" className="w-50 mb-4" />

            <nav className={"flex flex-col mt-4"}>
                {sections?.map((section, sectionIndex) => (
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
                            {section.items?.map((item, i) => (
                                <NavItem
                                    key={`${section.title || "sec"}-${i}`}
                                    to={item.to}
                                    label={item.label}
                                    Icon={item.icon}
                                    LinkComponent={Link}
                                />
                            ))}
                        </ul>
                    </React.Fragment>

                ))}
                <Link to="/logout" className="text-sm tracking-widest self-start font-poppins mt-2 ml-8 block">Sair</Link>
            </nav>
        </aside>
    );
}