import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function signBase64(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
}

// GET /api/persona/test?name=inquiry.approved&ref=8f62e1aa-a2ca-41e5-bc8e-f998abbd6af7&inq=inq_JEFE89h5xc123i1wjtbmHQTp1Rh3&status=completed&decision=approved
export async function GET(request) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name') || 'inquiry.approved';
  const referenceId = url.searchParams.get('ref') || 'user_123';
  const inquiryId = url.searchParams.get('inq') || `inq_${Date.now()}`;
  const status = url.searchParams.get('status') || 'completed';
  const decision = url.searchParams.get('decision') || (name === 'inquiry.approved' ? 'approved' : name === 'inquiry.declined' ? 'declined' : null);

  const event = {
    data: {
      type: 'event',
      attributes: {
        name,
        status,
        decision,
        'reference-id': referenceId,
      },
      relationships: {
        inquiry: {
          data: { id: inquiryId, type: 'inquiries' },
        },
      },
    },
  };

  const raw = JSON.stringify(event);
  const secret = process.env.PERSONA_WEBHOOK_SECRET || '';
  if (!secret) {
    return NextResponse.json({ error: 'PERSONA_WEBHOOK_SECRET not set' }, { status: 500 });
  }

  // Timestamped + base64 signature to mimic Persona more closely
  const t = Math.floor(Date.now() / 1000);
  const sig = signBase64(`${t}.${raw}`, secret);
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const resp = await fetch(`${base}/api/persona/webhook`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'persona-signature': `t=${t}, s=${sig}`,
    },
    body: raw,
  });

  let body = null;
  try { body = await resp.json(); } catch {}

  return NextResponse.json({ forwardedStatus: resp.status, webhookResponse: body, sentEvent: event });
}
