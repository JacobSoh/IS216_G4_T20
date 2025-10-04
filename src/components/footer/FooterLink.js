"use client";
import Link from "next/link";

export default function FooterLink({
    title,
    links
}) {
    return (
        <section>
            <h3 className='text-2xl font-bold tracking-tight text-white'>{title}</h3>
            <div className='text-white mt-6 flex flex-col items-start justify-start'>
                {links.map(s => (
                    <Link key={s.name + '_footer'} href={s.href} className='text-md no-underline'>
                        {s.name}
                    </Link>
                ))}
            </div>
        </section>
    )
}