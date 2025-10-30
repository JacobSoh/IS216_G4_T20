import { useId, useState } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const CONTROL_PRESETS = {
  auctionDescription: { label: "Auction Description", placeholder: "Briefly describe your auction..." },
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
  rows: rowsAlt,
  id: idProp,
  ...rest
}) {
  const autoId = useId();
  const id = idProp ?? `fi-${type}-${autoId}`;

  const preset = resolveControl(type);
  const finalLabel = label ?? preset.label;
  const finalType = inputType ?? preset.inputType;
  const finalPlaceholder = placeholder ?? preset.placeholder;
  const finalRows = rowProp ?? 5;

  const [value, setValue] = useState("");

  return (
    <Field className={containerClassName}>
      {finalLabel !== '' && (
        <FieldLabel htmlFor={id} className='text-[var(--theme-secondary)]'>
          {finalLabel}:
        </FieldLabel>
      )}
      <Textarea
        id={id}
        type={finalType}
        name={type}
        placeholder={finalPlaceholder}
        required={required}
        onChange={(e) => setValue(e.target.value)}
        value={value}
        rows={finalRows}
      />
      <FieldError>{finalError}</FieldError>
    </Field>
  );
}
