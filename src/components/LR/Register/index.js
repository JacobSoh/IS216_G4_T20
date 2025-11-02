'use client';
import { useEffect, useMemo, useReducer, useState } from 'react';
import ToggleLR from '@/components/LR/Sub/ToggleLR';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useModal } from '@/context/ModalContext';

import {
  CustomInput
} from '@/components/Form/CustomInput';

import {
  emailRe,
  usernameRe,
  passwordRe,
} from "@/lib/validators";
import { FieldGroup } from '@/components/ui/field';

const initial = { password: '', cfmPassword: '' };

const reducer = (s, a) => {
  switch (a.type) {
    case 'FIELD':
      return { ...s, [a.f]: a.value };
    case 'RESET':
      return { password: '', cfmPassword: '' };
    default:
      return s;
  };
};

export default function Register() {
  const [form, setForm] = useReducer(reducer, initial);

  const handleField = (f) => (e) => setForm({ type: 'FIELD', f, value: e.target.value });

  const matchErr = useMemo(() => {
    if (!form.cfmPassword) return '';
    return form.cfmPassword === form.password ? '' : "Passwords don't match.";
  }, [form.password, form.cfmPassword]);

  return (
    <FieldGroup>
      <CustomInput
        type='username'
        regex={usernameRe}
        regexMessage={'3-20 chars [A-Za-z0-9_]'}
        required={true}
      />
      <CustomInput
        type='email'
        regex={emailRe}
        regexMessage={'Enter a valid email.'}
        required={true}
      />
      <CustomInput
        type='password'
        value={form.password}
        onChange={handleField}
        regex={passwordRe}
        regexMessage={'Min 8, 1 upper, 1 lower, 1 digit, 1 symbol, no spaces.'}
        required={true}
      />
      <CustomInput
        type='cfmPassword'
        value={form.cfmPassword}
        onChange={handleField}
        err={matchErr}
        required={true}
      />
      <div className="mt-2">
        <ToggleLR isLogin={false} />
      </div>
    </FieldGroup>
  );
};
