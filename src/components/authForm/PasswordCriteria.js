import { useMemo } from "react";

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
        <div className='py-2 px-4 my-4 text-sm text-red-800 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-red-400'>
            <ul className="mt-2 space-y-1 text-sm">
                {pwdCriteria.map(({ key, label }) => {
                    const ok = flags[key];
                    console.log(label);
                    return (
                        <li key={key} className={`flex items-center gap-2 ${ok ? 'text-green-600' : 'text-red-600'}`}>
                            <span
                                aria-hidden="true"
                                className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]
                        ${ok ? "border-green-600" : "border-gray-400"}`}
                            >
                                {ok ? "✓" : "•"}
                            </span>
                            {label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
