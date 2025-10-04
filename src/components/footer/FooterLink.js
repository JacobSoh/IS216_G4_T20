"use client";
import Link from "next/link";

export default function FooterLink({ title, links=[], isLink=true, message=null }) {

    // <section>
    //     <h3 className='text-2xl font-bold tracking-tight text-(--custom-cream-yellow)'>BidHub</h3>
    //     <div className='mt-6 text-white'>
    //         <p className='text-md'>The modern way to discover and bid on unique items from around the world.</p>
    //     </div>
    // </section>
    return (
        <section>
            <h3 className={`text-2xl font-bold tracking-tight ${isLink?'text-white':'text-(--custom-cream-yellow)'}`}>{title}</h3>
            <div className={`mt-6 text-white ${isLink?'flex flex-col items-start justify-start':null}`}>
                {!isLink && message}
                {isLink && links.map(s => (
                    <Link key={s.name + '_footer_link'} href={s.href} className='text-md no-underline'>
                        {s.name}
                    </Link>
                ))}
            </div>
        </section>
    );
}