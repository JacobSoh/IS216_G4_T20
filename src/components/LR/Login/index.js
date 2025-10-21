'use client';
import { useEffect, useMemo, useReducer, useState } from 'react';
import AuthFormComponent from '@/components/Auth/AuthForm';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

import {
  CustomInput
} from '@/components/Form/CustomInput';

import {
  validateEmail,
  validatePassword,
} from "@/lib/validators";

import {
  FieldGroup,
} from '@/components/ui/field'

const intial = {
  email: "",
  password: "",
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

export default function Login() {
  const [form, setForm] = useReducer(reducer, intial);
  const [showLoading, setShowLoading] = useState(false);

  const handleField = (f) => (e) => {
    return setForm({ type: "FIELD", f, value: e.target.value });
  };

  const errs = useMemo(() => {
    const email =
      form.email && !validateEmail(form.email) ? "Enter a valid email." : "";

    const password =
      form.password && !validatePassword(form.password)
        ? "Min 8, 1 upper, 1 lower, 1 digit, 1 symbol, no spaces."
        : "";
    return { email, password };
  }, [form]);

  return (
    <FieldGroup>
      <CustomInput
        type='email'
        value={form.email}
        onChange={handleField}
        required={true}
      />
      <CustomInput
        type='password'
        value={form.password}
        onChange={handleField}
        required={true}
      />
    </FieldGroup>
  );
};