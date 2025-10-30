import { useId, useState } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const CONTROL_PRESETS = {
  firstname: { label: "First Name", inputType: "text", placeholder: "Enter your First Name" },
  middlename: { label: "Middle Name", inputType: "text", placeholder: "Enter your Middle Name" },
  lastname: { label: "Last Name", inputType: "text", placeholder: "Enter your Last Name" },
  street: { label: "Street", inputType: "text", placeholder: "Enter your Street" },
  city: { label: "City", inputType: "text", placeholder: "Enter your City" },
  state: { label: "State", inputType: "text", placeholder: "Enter your State" },
  zip: { label: "Zip", inputType: "text", placeholder: "Enter your Zip" },
  username: { label: "Username", inputType: "text", placeholder: "Enter your username" },
  email: { label: "Email", inputType: "email", placeholder: "Enter your email" },
  password: { label: "Password", inputType: "password", placeholder: "Enter your password" },
  auctionName: { label: "Auction Name", inputType: "text", placeholder: "Enter your auction name" },
  cfmPassword: { label: "Confirm Password", inputType: "password", placeholder: "Re-enter your password" },
  itemName: { label: "Item Name", inputType: "text", placeholder: "Enter your item name" },
  minBid: { label: "Min Bid ($)", inputType: "number", placeholder: "Minimum bid is $1" },
  bidIncrement: { label: "Bid Increment", inputType: "number", placeholder: "Enter your bid increment (optional)" },
  minutes: { label: "", inputType: "number", placeholder: "MM" },
  seconds: { label: "", inputType: "number", placeholder: "SS" },
};

function resolveControl(type) {
  return CONTROL_PRESETS[type] ?? { label: "", inputType: "text", placeholder: "Enter your ..." };
}

export function CustomInput({
  type,
  err,
  required,
  label,
  placeholder,
  inputType,
  id: idProp,
  value: valueProp,
  onChange: onChangeProp,
  defaultValue,
  // Optional inline regex validation per keystroke
  regex, // RegExp or string
  regexMessage = "Invalid value",
  ...rest
}) {

  const autoId = useId();
  const id = idProp ?? `fi-${type}-${autoId}`;
  
  const preset = resolveControl(type);
  const finalLabel = label ?? preset.label;
  const finalType = inputType ?? preset.inputType;
  const finalPlaceholder = placeholder ?? preset.placeholder;
  
  // Support both controlled and uncontrolled usage
  const isControlled = valueProp !== undefined;
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");

  const handleChange = (e) => {
    // Call parent handler in either curried or direct form
    if (typeof onChangeProp === "function") {
      try {
        const maybeHandler = onChangeProp(type);
        if (typeof maybeHandler === "function") {
          maybeHandler(e);
        } else {
          onChangeProp(e);
        }
      } catch {
        try { onChangeProp(e); } catch {}
      }
    }
    if (!isControlled) setInnerValue(e.target.value);
  };

  // Build validator from regex (supports RegExp or string)
  let validator = null;
  if (regex instanceof RegExp) {
    const flags = regex.flags?.replace('g', '') ?? '';
    validator = new RegExp(regex.source, flags);
  } else if (typeof regex === 'string' && regex) {
    try { validator = new RegExp(regex); } catch {}
  }
  const currentValue = isControlled ? valueProp : innerValue;
  const localError = validator && currentValue
    ? (validator.test(currentValue) ? "" : regexMessage)
    : "";
  const finalError = err || localError;

  return (
    <Field>
      {finalLabel!=='' && (
        <FieldLabel htmlFor={id}>
          {finalLabel}:
        </FieldLabel>
      )}
      <Input
        id={id}
        name={type}
        type={finalType}
        placeholder={finalPlaceholder}
        required={required}
        onChange={handleChange}
        value={currentValue}
        aria-invalid={!!finalError || undefined}
        {...rest}
      />
      <FieldError>{finalError}</FieldError>
    </Field>
  );
}
