import { useId, useState, useEffect } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const CONTROL_PRESETS = {
  auctionDescription: { label: "Auction Description", placeholder: "Briefly describe your auction..." },
  manageChatbox: { label: "Send Message", placeholder: "Share updates or engage with bidders..." },
  reviewText: { label: "Comment", placeholder: "Tell other buyers about this seller..." },
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
  name: nameProp,
  value: valueProp,
  onChange: onChangeProp,
  defaultValue,
  // Styling hooks
  containerClassName,
  className,
  // Auto-resize behavior
  autoGrow = false,
  growMaxHeight,
  // Inline regex validation
  regex,
  regexMessage = "Invalid value",
  ...rest
}) {
  const autoId = useId();
  const id = idProp ?? `fi-${type}-${autoId}`;

  const preset = resolveControl(type);
  const finalLabel = label ?? preset.label;
  const finalPlaceholder = placeholder ?? preset.placeholder;
  const finalRows = (rowsAlt ?? rowProp ?? 5);
  const finalName = nameProp ?? type;

  // Support controlled/uncontrolled
  const isControlled = valueProp !== undefined;
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");
  const [el, setEl] = useState(null);

  const handleChange = (e) => {
    if (typeof onChangeProp === "function") {
      try {
        const maybeHandler = onChangeProp(type);
        if (typeof maybeHandler === "function") {
          maybeHandler(e);
        } else {
          onChangeProp(e);
        }
      } catch {
        try { onChangeProp(e); } catch { }
      }
    }
    if (!isControlled) setInnerValue(e.target.value);
  };

  // Build validator from regex
  let validator = null;
  if (regex instanceof RegExp) {
    const flags = regex.flags?.replace('g', '') ?? '';
    validator = new RegExp(regex.source, flags);
  } else if (typeof regex === 'string' && regex) {
    try { validator = new RegExp(regex); } catch { }
  }

  const currentValue = isControlled ? valueProp : innerValue;
  const localError = validator && currentValue
    ? (validator.test(currentValue) ? "" : regexMessage)
    : "";
  const finalError = err || localError;

  // Auto-grow height to content
  useEffect(() => {
    if (!autoGrow || !el) return;
    try {
      el.style.height = 'auto';
      if (growMaxHeight) {
        el.style.maxHeight = typeof growMaxHeight === 'number' ? `${growMaxHeight}px` : `${growMaxHeight}`;
      }
      el.style.height = `${el.scrollHeight}px`;
    } catch { }
  }, [autoGrow, currentValue, el, growMaxHeight]);

  return (
    <Field className={containerClassName}>
      <FieldLabel htmlFor={id}>
        {finalLabel}
      </FieldLabel>
      <Textarea
        id={id}
        name={finalName}
        placeholder={finalPlaceholder}
        required={required}
        onChange={handleChange}
        value={currentValue}
        rows={autoGrow ? undefined : finalRows}
        aria-invalid={!!finalError || undefined}
        ref={setEl}
        className={className}
        {...rest}
      />
      <FieldError>{finalError}</FieldError>
    </Field>
  );
}
