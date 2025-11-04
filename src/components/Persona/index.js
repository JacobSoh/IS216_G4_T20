"use client";
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function VerifyButton({id, className}) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // when the CDN script has loaded, window.Persona will exist
  useEffect(() => {
    const i = setInterval(() => {
      if (typeof window !== "undefined" && window.Persona?.Client) {
        setReady(true);
        clearInterval(i);
      }
    }, 100);
    return () => clearInterval(i);
  }, []);

  const launch = useCallback(() => {
    const templateId = process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID;
    const environment = process.env.NEXT_PUBLIC_PERSONA_ENV || 'sandbox';

    const openHostedFallback = () => {
      try {
        const url = new URL('https://withpersona.com/verify');
        if (templateId) url.searchParams.set('templateId', templateId);
        if (id) url.searchParams.set('referenceId', String(id));
        if (environment) url.searchParams.set('environment', environment);
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
      } catch (e) {
        // As a last resort, navigate current tab
        window.location.href = `https://withpersona.com/verify?templateId=${encodeURIComponent(templateId || '')}&referenceId=${encodeURIComponent(String(id || ''))}&environment=${encodeURIComponent(environment || '')}`;
      }
    };

    // If SDK not ready, fall back to hosted flow
    if (!window.Persona?.Client) {
      openHostedFallback();
      return;
    }

    // If app is running inside an iframe, some browsers/extensions block embedding.
    // Prefer opening hosted flow instead of modal iframe to avoid X-Frame-Options issues.
    const isFramed = (() => { try { return window.self !== window.top; } catch { return true; } })();
    if (isFramed) {
      openHostedFallback();
      return;
    }

    const client = new window.Persona.Client({
      templateId,
      environment,
      referenceId: id,
      onReady: () => {
        try { client.open(); } catch { openHostedFallback(); }
      },
      onComplete: ({ inquiryId, status }) => {
        try { client.close(); } catch {}
        toast.success("Verification Completed! It takes 3 working days for verification to be completed.");
        router.refresh();
      },
      onCancel: () => {},
      onError: (e) => {
        console.error('[Persona] error', e);
        // Fallback if iframe/modal is blocked by X-Frame-Options
        openHostedFallback();
      },
    });
  }, [id, router]);

  return (
    <Button
      onClick={launch}
      disabled={!ready}
      variant="link"
      className={className}
    >
      <ShieldCheck /> {ready || !!id ? "Verify my ID" : "Loading verifier…"}
    </Button>
  );
}
