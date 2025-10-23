import { useId } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";

export function CustomFileInput({
  type,
  label, 
  err,
  required,
  filterRule,
  fullWidth = true,
  maxLength,
  ...rest
}) {
  const autoId = useId();
  const id = `fi-${type}-${autoId}`;

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
      </FieldLabel>
      <div className={`w-full max-w-4xl relative mx-auto border border-dashed rounded-lg bg-[var(--theme-surface)] border-[var(--theme-border)]`}>
        <FileUpload id={id} name={type} required={true} filterRule={filterRule} maxLength={maxLength}/>
      </div>
      <FieldError>{err}</FieldError>
    </Field>
  );
}
