import { Link as RouterLink, useLocation } from "react-router-dom";

export default function NavItem({ to, label, Icon, LinkComponent }) {
  const EffectiveLinkComponent = LinkComponent || RouterLink;
  const location = useLocation()
  const active = ( location.pathname === to || location.pathname.startsWith(`${to}/`))

  return (
    <li className={`"group flex flex-row items-center rounded ${active? 'bg-[#D5D9EF]': 'hover:bg-[#D5D9EF]'} "`}>
      {Icon ? (
        <Icon
          className={`text-[#031933] group-hover:text-[#031933] transition-colors`}
          size="20px"
        />
      ) : null}
      <EffectiveLinkComponent
        to={to}
        className={`text-[#031933] group-hover:text-[#031933] font-semibold px-3 py-2 font-poppins`}
      >
        {label}
      </EffectiveLinkComponent>
    </li>
  );
}