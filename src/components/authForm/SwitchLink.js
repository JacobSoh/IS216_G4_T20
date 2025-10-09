'use client'

import Link from 'next/link'

export default function SwitchLink({ isLogin, nextUrl }) {
  const target = isLogin ? '/register' : '/login'
  const href = nextUrl ? `${target}?next=${encodeURIComponent(nextUrl)}` : target
  return (
    <p className="mt-4 text-center text-sm/6 text-gray-400">
      {isLogin ? 'Not a member' : 'Already have an account'}?&nbsp;
      <Link href={href} className="font-semibold text-indigo-400 hover:text-indigo-300">
        {isLogin ? 'Join us now!' : 'Login!'}
      </Link>
    </p>
  )
}
