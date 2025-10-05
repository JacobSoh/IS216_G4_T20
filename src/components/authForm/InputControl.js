import { Input, Field, Label } from "@headlessui/react";

import {
    Error,
    PasswordCriteria
} from '@/components/authForm/index';

export default function InputControl({
    labelText,
    formName,
    type,
    value,
    isRequired,
    onKeyDown,
    onChange,
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
                onKeyDown={onKeyDown}
                onChange={onChange}
                placeholder={placeholder}
            />
            {value?.length > 0 && <PasswordCriteria pwd={value} />}
            {/* {pwdRequirement?<Error error={error}/>:null} */}
        </Field>
    )
}