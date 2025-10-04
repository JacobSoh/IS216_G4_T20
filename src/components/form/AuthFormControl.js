import { Input, Field, Label, Button } from "@headlessui/react";

export default function AuthFormControl({
    labelText,
    formName,
    type,
    isRequired,
    onkeypress,
    placeholder
}) {
    return (
        <Field className="space-y-2">
            <Label className="block text-sm/6 font-medium text-white" htmlFor={formName}>
                {labelText}
                {isRequired?<span className="hidden ms-2 ms-2 items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 inset-ring inset-ring-red-400/20">Required</span>:null}:
            </Label>
            <Input
                id={formName}
                name={formName}
                type={type}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                required={isRequired}
                onKeyDown={onkeypress}
                placeholder={placeholder}
            />
        </Field>
    )
}