// hooks/useAuthForm.js
"use client";

import { useReducer, useMemo } from "react";
import {
    validateEmail,
    validateUsername,
    validatePassword,
} from "@/lib/validators";



const initial = {
    firstName: '',
    middleName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    username: '',
};

function reducer(state, action) {
    switch (action.type) {
        case "FIELD":
            return { ...state, [action.field]: action.value };
        case "RESET":
            return initialForm;
        default:
            return state;
    };
};

export function useSettingsForm() {
    const [form, dispatch] = useReducer(reducer, initial);

    // per-field change helper
    const handleField =
        (field) =>
            (e) =>
                dispatch({ type: "FIELD", field, value: e.target.value });

    const handleReset =
        (e) =>
            dispatch({ type: "RESET"});

    // compute field errors (strings) once per render
    const errors = useMemo(() => {
        const emailErr =
            form.email && !validateEmail(form.email) ? "Enter a valid email." : "";

        const passwordErr =
            form.password && !validatePassword(form.password)
                ? "Min 8, 1 upper, 1 lower, 1 digit, 1 symbol, no spaces."
                : "";

        const matchErr =
            form.confirm_password !== form.password
                ? "Passwords don't match."
                : "";

        const usernameErr =
            form.username && !validateUsername(form.username)
                ? "3-20 chars [A-Za-z0-9_]"
                : "";

        return { emailErr, passwordErr, matchErr, usernameErr };
    }, [form]);

    // empty-field checks split by mode (you can gate them by hover/focus in the component)
    const emptyRegister =
        !form.email ||
        !form.password ||
        !form.confirm_password ||
        !form.username;

    // helper to compute `hasErrors` (lets caller decide *when* to consider empties)
    const getHasErrors = (validateEmpties) => {
        const left =
            errors.emailErr || errors.passwordErr || errors.usernameErr || errors.matchErr;
        return Boolean((validateEmpties && emptyRegister) || left);
    };

    return {
        form,
        dispatch,
        handleField,
        handleReset,
        errors,
        getHasErrors,
    };
}
