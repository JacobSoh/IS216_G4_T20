import { useId } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";

export function CustomFileInput({
  type,
  label, 
  onChange,
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
      <div className={`w-full max-w-4xl relative mx-auto border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg`}>
        <FileUpload id={id} name={type} onChange={onChange} required={true} filterRule={filterRule} maxLength={maxLength}/>
      </div>
      <FieldError>{err}</FieldError>
    </Field>
  );
}
