import { useId } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const CONTROL_PRESETS = {
  auctionDescription: { 
    label: "Auction Description", 
    placeholder: "Briefly describe your auction..." 
  },
  itemDescription: { 
    label: "Item Description", 
    placeholder: "Briefly describe the item..." 
  },
};

function resolveControl(type) {
  return CONTROL_PRESETS[type] ?? { 
    label: "", 
    inputType: "text", 
    placeholder: "Enter your ..." 
  };
}

export function CustomTextarea({
  type,
  err,
  required,
  label,
  placeholder,
  inputType,
  row: rowProp,
  id: idProp,
  value,
  onChange,
  ...rest
}) {
  const autoId = useId();
  const id = idProp ?? `fi-${type}-${autoId}`;
  
  const preset = resolveControl(type);
  const finalLabel = label ?? preset.label;
  const finalType = inputType ?? preset.inputType;
  const finalPlaceholder = placeholder ?? preset.placeholder;
  const finalRows = rowProp ?? 5;

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {finalLabel}
      </FieldLabel>
      <Textarea
        id={id}
        type={finalType}
        name={type}
        placeholder={finalPlaceholder}
        required={required}
        onChange={onChange}
        value={value}
        rows={finalRows}
        {...rest}
      />
      <FieldError>{err}</FieldError>
    </Field>
  );
}
