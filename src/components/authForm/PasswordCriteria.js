'use client';
import { useMemo, forwardRef } from "react";
import { 
    CheckCircleIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const MIN_LEN = 8;

function analyzePassword(pwd) {
    const n = pwd?.length;
    let hasUpper = false, hasLower = false, hasDigit = false, hasSymbol = false, hasSpace = false;

    for (let i = 0; i < n; i++) {
        const c = pwd.charCodeAt(i);
        if (c === 32 || (c >= 9 && c <= 13)) { hasSpace = true; continue; } // spaces/tabs/newlines
        if (c >= 48 && c <= 57) { hasDigit = true; continue; }              // 0-9
        if (c >= 65 && c <= 90) { hasUpper = true; continue; }              // A-Z
        if (c >= 97 && c <= 122) { hasLower = true; continue; }             // a-z
        hasSymbol = true;                                                   // everything else
    };

    const obj = {
        minLen: n >= MIN_LEN,
        upper: hasUpper,
        lower: hasLower,
        digit: hasDigit,
        symbol: hasSymbol,
        noSpace: !hasSpace,
    };

    return obj;
};

export default function PasswordCriteria({ pwd }) {
    const flags = useMemo(() => analyzePassword(pwd), [pwd]);
    const pwdCriteria = [
        { key: 'minLen', label: `At least ${MIN_LEN} characters` },
        { key: 'upper', label: 'At least 1 uppercase letter' },
        { key: 'lower', label: 'At least 1 lowercase letter' },
        { key: 'digit', label: 'At least 1 number' },
        { key: 'symbol', label: 'At least 1 symbol' },
        { key: 'noSpace', label: 'No spaces' },
    ];

    return (
        <ul className="mt-2 space-y-1 text-sm">
            {pwdCriteria.map(({ key, label }) => {
                const ok = flags[key];
                return (
                    <li key={key} className={`flex items-center gap-1 ${ok ? 'text-green-600' : 'text-red-600'}`}>
                        {
                            ok? (<CheckCircleIcon aria-hidden='true' className='block size-6' />):
                            (<ExclamationTriangleIcon aria-hidden='true' className='block size-6' />)
                        }
                        {label}
                    </li>
                );
            })}
        </ul>
    );
};
