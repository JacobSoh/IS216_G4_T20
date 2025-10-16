import { CreditCardIcon, LinkIcon, Cog8ToothIcon } from "@heroicons/react/24/outline";

const switchLogo = (icon) => {
  switch (icon) {
    case 'creditcard': return <CreditCardIcon width={30} height={30} />;
    case 'link': return <LinkIcon width={30} height={30} />;
    case 'gear': return <Cog8ToothIcon width={30} height={30} />;
    default: return;
  }
};

export default function Options({
  icon,
  onClick,
  text,
  bgColor
}) {
  const isNumber = Number.isInteger(text);
  const className = `px-4 py-2 text-white border rounded-md text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-md
  ${bgColor}`
  

  return (
    <button
      onClick={onClick}
      className={className}
    >
      {switchLogo(icon)}
      <span>{isNumber?'$':''}{text}</span>
    </button>
  );
};