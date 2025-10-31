import { useId, useState } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const CONTROL_PRESETS = {
  auctionDescription: { label: "Auction Description", placeholder: "Briefly describe your auction..." },
  itemDescription: { label: "Item Description", placeholder: "Describe your item..." },
};

function resolveControl(type) {
  return CONTROL_PRESETS[type] ?? { label: "", placeholder: "Enter your ..." };
}

export function CustomTextarea({
  type,
  err,
  required,
  label,
  placeholder,
  id: idProp,
  value: valueProp,
  onChange: onChangeProp,
  defaultValue,
  rows = 4,
  ...rest
}) {
  const autoId = useId();
  const id = idProp ?? `textarea-${type}-${autoId}`;
  
  const preset = resolveControl(type);
  const finalLabel = label ?? preset.label;
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

  const currentValue = isControlled ? valueProp : innerValue;

  return (
    <Field>
      {finalLabel !== '' && (
        <FieldLabel htmlFor={id} className="!text-white">
          {finalLabel}:
        </FieldLabel>
      )}
      <Textarea
        id={id}
        name={type}
        placeholder={finalPlaceholder}
        required={required}
        onChange={handleChange}
        value={currentValue}
        rows={rows}
        aria-invalid={!!err || undefined}
        {...rest}
      />
      <FieldError>{err}</FieldError>
    </Field>
  );
}
