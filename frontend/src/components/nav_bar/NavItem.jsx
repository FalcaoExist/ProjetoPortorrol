import { Link as RouterLink } from "react-router-dom";

export default function NavItem({ to, label, Icon, LinkComponent }) {
  const EffectiveLinkComponent = LinkComponent || RouterLink;

  return (
    <li className="group flex flex-row items-center rounded hover:bg-[#D5D9EF]">
      {Icon ? (
        <Icon
          className="text-[#A6ABC8] group-hover:text-[#2D205E] transition-colors"
          size="20px"
        />
      ) : null}
      <EffectiveLinkComponent
        to={to}
        className="text-[#A6ABC8] group-hover:text-[#2D205E] font-semibold px-3 py-2 font-poppins"
      >
        {label}
      </EffectiveLinkComponent>
    </li>
  );
}