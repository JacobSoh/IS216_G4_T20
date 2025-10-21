import { useId } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const CONTROL_PRESETS = {
  username: { label: "Username", inputType: "text", placeholder: "Enter your username" },
  email: { label: "Email", inputType: "email", placeholder: "Enter your email" },
  password: { label: "Password", inputType: "password", placeholder: "Enter your password" },
  cfmPassword: { label: "Confirm Password", inputType: "password", placeholder: "Re-enter your password" },
};

function resolveControl(type) {
  return CONTROL_PRESETS[type] ?? { label: "", inputType: "text", placeholder: "Enter your ..." };
}

export function CustomInput({
  type,
  value,
  onChange,
  err,
  required,
  label,
  placeholder,
  inputType,
  id: idProp,
  ...rest
}) {
  const autoId = useId();
  const id = idProp ?? `fi-${type}-${autoId}`;
  
  const preset = resolveControl(type);
  const finalLabel = label ?? preset.label;
  const finalType = inputType ?? preset.inputType;
  const finalPlaceholder = placeholder ?? preset.placeholder;

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {finalLabel}
      </FieldLabel>
      <Input
        id={id}
        name={type}
        type={finalType}
        placeholder={finalPlaceholder}
        required={required}
        onChange={onChange(type)}
        value={value}
      />
      <FieldError>{err}</FieldError>
    </Field>
  );
}
