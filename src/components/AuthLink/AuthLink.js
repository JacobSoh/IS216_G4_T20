'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';
import { useModal } from '@/context/ModalContext';
import { supabaseBrowser } from '@/utils/supabase/client';
// import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function ProtectedLink({ href, ModalComponent, children }) {
    const { isAuthed } = useSupabaseAuth();
    const router = useRouter();
    const { openModal } = useModal();
    const { showAlert } = useAlert();
    const sb = supabaseBrowser();

    async function onClick(e) {
        // Always intercept click; only allow if authed
        e.preventDefault();
        if (!isAuthed) {
            showAlert({message: 'Please Login First!', variant: 'warning'});
            openModal({content: <ModalComponent/>,title: 'Login'});
            return;
        };
        console.log(href);
        router.push(href);
    }

    return (
        <Link href={href} onClick={onClick}>
            {children}
        </Link>
    );
}
