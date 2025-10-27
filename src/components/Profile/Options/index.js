import { Button } from "@/components/ui/button";
import { ShieldCheckIcon, CreditCardIcon, LinkIcon, Cog8ToothIcon } from "@heroicons/react/24/outline";

const switchLogo = (icon) => {
  switch (icon) {
    case 'verify': return <ShieldCheckIcon />;
    case 'creditcard': return <CreditCardIcon />;
    case 'link': return <LinkIcon />;
    case 'gear': return <Cog8ToothIcon />;
    default: return;
  }
};

export default function Options({
  variant = 'outline',
  icon,
  onClick,
  text,
  bgColor
}) {
  const isNumber = Number.isInteger(text);
  const className = `px-4 py-2 text-white border rounded-md text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-md
  ${bgColor}`
  

  return (
    <Button
      onClick={onClick}
      variant={variant}
    >
      {switchLogo(icon)}
      <span>{isNumber?'$':''}{text}</span>
    </Button>
  );
};