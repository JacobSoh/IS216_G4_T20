import { usePathname } from 'next/navigation';
export function useIsActive() {
    const pathname = usePathname();
    return (href) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);
}