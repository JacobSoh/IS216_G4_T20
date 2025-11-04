import { useEffect, useId, useState } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";

export function CustomSelect({
  type,
  label,
  err,
  required,
  placeholder = "Select an option",
  options = [],
  value,
  defaultValue,
  onChange,
  disabled = false,
  className,
  ...rest
}) {
  const autoId = useId();
  const id = `select-${type}-${autoId}`;
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");

  // Hover observer effect like CustomInput
  const radius = 100;
  const [hoverVisible, setHoverVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const handleMouseMove = ({ currentTarget, clientX, clientY }) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const isControlled = value !== undefined;

  const handleValueChange = (event) => {
    const val = event?.target?.value ?? "";
    if (!isControlled) {
      setInnerValue(val);
    }
    if (typeof onChange === "function") {
      try {
        const maybe = onChange(type);
        if (typeof maybe === "function") {
          maybe({ target: { name: type, value: val } });
          return;
        }
      } catch { }
      onChange({ target: { name: type, value: val } });
    }
  };

  const safeOptions = Array.isArray(options)
    ? options.filter(
        (opt) =>
          opt &&
          opt.label != null &&
          opt.value !== undefined &&
          String(opt.value) !== ""
      )
    : [];

  useEffect(() => {
    if (!isControlled) {
      setInnerValue(defaultValue ?? "");
    }
  }, [defaultValue, isControlled]);

  const currentValue = isControlled ? value : innerValue;

  return (
    <Field>
      {label && (
        <FieldLabel htmlFor={id}>
          {label}
        </FieldLabel>
      )}
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${hoverVisible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
              var(--theme-secondary),
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHoverVisible(true)}
        onMouseLeave={() => setHoverVisible(false)}
        className="rounded-md p-[2px] transition duration-300 w-full"
      >
        <select
          id={id}
          name={type}
          value={currentValue ?? ""}
          onChange={handleValueChange}
          required={required}
          disabled={disabled}
          aria-invalid={!!err || undefined}
          className={`flex h-10 w-full rounded-md border border-[var(--theme-primary)] bg-background px-3 py-2 text-sm text-[var(--theme-surface-contrast)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {safeOptions.map((opt) => {
            const val = String(opt.value);
            return (
              <option key={val} value={val}>
                {opt.label}
              </option>
            );
          })}
        </select>
      </motion.div>
      {/* <select
        id={id}
        name={type}
        required={required}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        className="flex h-10 w-full rounded-md bg-[var(--theme-surface)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
        style={{
          appearance: 'none',
          border: isFocused ? '2px solid #8b5cf6' : '1px solid var(--theme-border)',
          outline: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1rem',
          paddingRight: '2.5rem'
        }}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select> */}
     <FieldError>{err}</FieldError>
    </Field>
  );
}
