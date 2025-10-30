import { useId, useState, useEffect } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const CONTROL_PRESETS = {
  auctionDescription: { label: "Auction Description", placeholder: "Briefly describe your auction..." },
  manageChatbox: { label: "Send Message", placeholder: "Share updates or engage with bidders..." }
};

function resolveControl(type) {
  return CONTROL_PRESETS[type] ?? { label: "", inputType: "text", placeholder: "Enter your ..." };
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
  value: valueProp,
  onChange: onChangeProp,
  defaultValue,
  // Styling hooks
  containerClassName,
  className,
  // Auto-resize behavior (content-based). When true, height tracks content
  autoGrow = false,
  growMaxHeight, // px number or string like '200px'
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
  const finalRows = (rowsAlt ?? rowProp ?? 5);

  // Support both controlled and uncontrolled usage
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

  // Auto-grow to fit content height
  const applyAutoGrow = () => {
    if (!autoGrow || !el) return;
    try {
      const style = el.style;
      style.height = 'auto';
      const targetHeight = el.scrollHeight;
      if (growMaxHeight) {
        const maxH = typeof growMaxHeight === 'number' ? `${growMaxHeight}px` : `${growMaxHeight}`;
        style.maxHeight = maxH;
      }
      style.height = `${el.scrollHeight}px`;
    } catch {}
  };

  // Re-apply when value changes or element mounts
  useEffect(() => { if (autoGrow) applyAutoGrow(); }, [autoGrow, currentValue, el]);

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
