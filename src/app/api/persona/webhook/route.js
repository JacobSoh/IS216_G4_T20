import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabaseServer } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function parseSignatureHeader(hdr = '') {
  // Supports formats like: "t=1698520000, s=BASE64SIG" or "v1=HEX" or raw value
  const parts = Object.fromEntries(
    hdr
      .split(',')
      .map((kv) => kv.trim())
      .filter(Boolean)
      .map((kv) => {
        const [k, v] = kv.split('=');
        return [k, v];
      })
      .filter(([, v]) => typeof v === 'string' && v.length > 0)
  );
  const t = parts.t;
  const s = parts.s || parts.v1; // common variants
  return { t, s, raw: hdr };
}

function computeHmac(payload, secret, encoding = 'hex') {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest(encoding);
}

export async function POST(request) {
  console.log(request);
  // 1) Verify HMAC (support timestamped + base64 or hex)
  const sigHeader =
    request.headers.get('persona-signature') ||
    request.headers.get('Persona-Signature') ||
    request.headers.get('x-persona-signature') ||
    '';
  const raw = await request.text();
  const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET || '';
  const { t, s, raw: rawHeader } = parseSignatureHeader(sigHeader);

  const payloads = t ? [`${t}.${raw}`, raw] : [raw];
  const candidates = [];
  for (const p of payloads) {
    candidates.push(computeHmac(p, webhookSecret, 'hex'));
    candidates.push(computeHmac(p, webhookSecret, 'base64'));
  }
  const provided = s || rawHeader;
  const ok = candidates.some((exp) => safeEqual(exp, provided));
  if (!ok) return NextResponse.json({ error: 'bad signature' }, { status: 400 });

  console.log("done1");

  // 2) Parse event
  const evt = JSON.parse(raw);

  // Helper to try multiple paths safely
  const pick = (...paths) => {
    for (const p of paths) {
      try {
        const v = p();
        if (v !== undefined && v !== null) return v;
      } catch {}
    }
    return undefined;
  };

  const name = pick(
    () => evt.data.attributes.name
  ); // e.g., "inquiry.approved"

  const inquiryId = pick(
    () => evt.data.relationships.inquiry.data.id,
    () => evt.data.attributes.payload.data.id,
    () => evt.data.attributes.payload.id,
    () => evt.data.attributes.inquiry_id,
    () => evt.data.attributes.inquiry?.data?.id
  );

  if (!inquiryId) return NextResponse.json({ ok: true }); // ignore unknown

  // 3) Resolve inquiry details and reference-id (your userId)
  // Try from event payload first; fall back to Persona API for canonical data
  let referenceId = pick(
    () => evt.data.attributes['reference-id'],
    () => evt.data.attributes.referenceId,
    () => evt.data.attributes.payload.data.attributes['reference-id'],
    () => evt.data.attributes.payload.data.attributes.referenceId,
    () => evt.data.attributes.payload.attributes['reference-id'],
    () => evt.data.attributes.payload.attributes.referenceId
  );
  let status = pick(
    () => evt.data.attributes.status,
    () => evt.data.attributes.payload.data.attributes.status,
    () => evt.data.attributes.payload.attributes.status
  ); // created|started|completed|failed...
  let decision = pick(
    () => evt.data.attributes.decision,
    () => evt.data.attributes.payload.data.attributes.decision,
    () => evt.data.attributes.payload.attributes.decision
  ) ?? null; // approved|declined|needs-review|null
  if (!referenceId || !status) {
    const personaApiKey = process.env.PERSONA_API_KEY || '';
    if (personaApiKey) {
      const personaRes = await fetch(`https://api.withpersona.com/api/v1/inquiries/${inquiryId}`, {
        headers: {
          Authorization: `Bearer ${personaApiKey}`,
          'Persona-Version': '2023-01-05',
        },
        cache: 'no-store',
      });
      const { data } = await personaRes.json();
      referenceId = referenceId || data?.attributes?.['reference-id'];
      status = status || data?.attributes?.status;
      decision = decision ?? data?.attributes?.decision ?? null;
    }
  }
  const sb = await supabaseServer();

  // 4) Upsert verification record (idempotent)
  if (referenceId) {
    const { data, error } = await sb
      .from('persona')
      .upsert(
        {
          id: inquiryId,
          oid: referenceId,
          status: status ?? null,
          decision: decision ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (error) throw new Error(error.message);
  }

  // 5) Flip the user flag ONLY on approved
  if (name === 'inquiry.approved' && !!referenceId) {
    const { error } = await sb
      .from('profile')
      .update({ verified: true })
      .eq('id', referenceId);
    if (error) throw new Error(error.message);
  };

  return NextResponse.json({ ok: true });
}
