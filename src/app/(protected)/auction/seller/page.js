import SellerConsole from "@/components/Auction/seller/console";
import { getServerUser } from "@/utils/auth";
import { headers } from "next/headers";

export default async function SellerPage() {
  const user = await getServerUser();
  let auctions = [];
  try {
    if (user?.id) {
      const hdrs = await headers();
      const host = hdrs.get('x-forwarded-host') || hdrs.get('host');
      const proto = hdrs.get('x-forwarded-proto') || 'http';
      const base = `${proto}://${host}`;
      const res = await fetch(`${base}/api/auctions?seller=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
      const json = await res.json();
      auctions = Array.isArray(json?.record) ? json.record : [];
      console.log(auctions);
    }
  } catch {}

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        <SellerConsole auctions={auctions} />
      </div>
    </div>
  );
}
