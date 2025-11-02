'use client';
import { useEffect, useMemo, useReducer, useState } from 'react';
import ToggleLR from '@/components/LR/Sub/ToggleLR';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

import {
  CustomInput
} from '@/components/Form/CustomInput';

import {
  emailRe,
  passwordRe,
} from "@/lib/validators";

import {
  FieldGroup,
} from '@/components/ui/field'

export default function Login() {
  return (
    <FieldGroup>
      <CustomInput
        type='email'
        regex={emailRe}
        regexMessage={'Enter a valid email.'}
        required={true}
      />
      <CustomInput
        type='password'
        regex={passwordRe}
        regexMessage={'Min 8, 1 upper, 1 lower, 1 digit, 1 symbol, no spaces.'}
        required={true}
      />
      <div className="mt-2">
        <ToggleLR isLogin />
      </div>
    </FieldGroup>
  );
};
