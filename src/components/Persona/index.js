"use client";
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function VerifyButton({id, className}) {
  const [ready, setReady] = useState(false);

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
    if (!window.Persona?.Client) {
      toast.info("Persona not yet up!");
      return null;
    };

    const client = new window.Persona.Client({
      templateId: process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID, 
      environmentId: process.env.NEXT_PUBLIC_PERSONA_ENV_ID,
      referenceId: id,
      onReady: () => {
        client.open()
      },
      onComplete: ({ inquiryId, status }) => {
        client.close();
        toast.success("Verification Completed! It takes 3 working days for verification to be completed.");
        const router = useRouter();
        router.refresh();
      },
      onCancel: () => {},
      onError: (e) => console.error(e),
    });
  }, [id]);

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
