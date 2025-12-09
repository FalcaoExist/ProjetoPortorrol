import { Link as RouterLink, useLocation } from "react-router-dom";

export default function NavItem({ to, label, Icon, LinkComponent }) {
  const EffectiveLinkComponent = LinkComponent || RouterLink;
  const location = useLocation()
  const active = ( location.pathname === to || location.pathname.startsWith(`${to}/`))

  return (
    <li className="group flex flex-row items-center rounded hover:bg-[#D5D9EF]">
      {Icon ? (
        <Icon
          className={`${active? "text-[#2D205E]": "text-[#A6ABC8]"} group-hover:text-[#2D205E] transition-colors`}
          size="20px"
        />
      ) : null}
      <EffectiveLinkComponent
        to={to}
        className={`${active? "text-[#2D205E]": "text-[#A6ABC8]"} group-hover:text-[#2D205E] font-semibold px-3 py-2 font-poppins`}
      >
        {label}
      </EffectiveLinkComponent>
    </li>
  );
}