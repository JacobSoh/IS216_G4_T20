'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useModal } from '@/context/ModalContext';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from 'sonner';

export default function ProtectedLink({ href, ModalComponent, children, ...props }) {
    const { isAuthed } = useSupabaseAuth();
    const router = useRouter();
    const { openModal } = useModal();
    const sb = supabaseBrowser();

    async function onClick(e) {
        // Always intercept click; only allow if authed
        e.preventDefault();
        if (!isAuthed) {
            toast.warning("Please login first!");
            openModal({content: <ModalComponent/>,title: 'Login'});
            return;
        };
        router.push(href);
    }

    return (
        <Link href={href} onClick={onClick} {...props}>
            {children}
        </Link>
    );
}
