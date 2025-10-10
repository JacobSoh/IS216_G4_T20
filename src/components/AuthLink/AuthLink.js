// components/ProtectedLink.jsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';
import { useModal } from '@/context/ModalContext';
import { supabaseBrowser } from '@/utils/supabase/client';

export default function ProtectedLink({ href, ModalComponent, children }) {
    const router = useRouter();
    const { openModal } = useModal();
    const { showAlert } = useAlert();
    const sb = supabaseBrowser();

    async function onClick(e) {
        // Always intercept click; only allow if authed
        e.preventDefault();

        const { data: { session } } = await sb.auth.getSession();

        if (!session) {
            sessionStorage.setItem('next_path', href);
            
            showAlert({message: 'Please Login First!', variant: 'warning'});
            openModal({content: ModalComponent,title: 'Login', className: 'text-2xl font-bold tracking-tight text-(--custom-cream-yellow)'});
            return;
        }

        // user authed → perform the navigation
        router.push(href);
    }

    // Use <Link> for semantics/SEO but block nav onClick when not authed
    return (
        <Link href={href} onClick={onClick}>
            {children}
        </Link>
    );
}
