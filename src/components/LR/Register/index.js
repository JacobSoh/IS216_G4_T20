'use client';
import { useEffect, useMemo, useReducer, useState } from 'react';
import AuthFormComponent from '@/components/Auth/AuthForm';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useModal } from '@/context/ModalContext';

import {
  CustomInput
} from '@/components/Form/CustomInput';

import {
  validateEmail,
  validateUsername,
  validatePassword,
} from "@/lib/validators";
import { FieldGroup } from '@/components/ui/field';

const intial = {
  username: "",
  email: "",
  password: "",
  cfmPassword: "",
};


function reducer(s, a) {
  switch (a.type) {
    case "FIELD":
      return { ...s, [a.f]: a.value };
    case "RESET":
      return a.value;
    default:
      return s;
  };
};

export default function Register() {
  const [form, setForm] = useReducer(reducer, intial);
  const [showLoading, setShowLoading] = useState(false);

  const handleField = (f) => (e) => {
    return setForm({ type: "FIELD", f, value: e.target.value });
  };


  const errs = useMemo(() => {
    const username =
      form.username && !validateUsername(form.username)
        ? "3-20 chars [A-Za-z0-9_]"
        : "";

    const email =
      form.email && !validateEmail(form.email) ? "Enter a valid email." : "";

    const password =
      form.password && !validatePassword(form.password)
        ? "Min 8, 1 upper, 1 lower, 1 digit, 1 symbol, no spaces."
        : "";

    const match =
      form.cfmPassword !== form.password
        ? "Passwords don't match."
        : "";

    return { username, email, password, match };
  }, [form]);

  return (
    <FieldGroup>
      <CustomInput
        type='username'
        value={form.username}
        onChange={handleField}
        err={errs.username}
        required={true}
      />
      <CustomInput
        type='email'
        value={form.email}
        onChange={handleField}
        err={errs.email}
        required={true}
      />
      <CustomInput
        type='password'
        value={form.password}
        onChange={handleField}
        err={errs.password}
        required={true}
      />
      <CustomInput
        type='cfmPassword'
        value={form.cfmPassword}
        onChange={handleField}
        err={errs.match}
        required={true}
      />
    </FieldGroup>
  );
};