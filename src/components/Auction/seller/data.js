// Shared mock data for seller views
export const mockAuctions = [
  {
    id: "a1",
    title: "Vintage Camera Collection",
    status: "live",
    startAt: "2025-10-01T10:00:00Z",
    endAt: "2025-11-05T10:00:00Z",
    bids: 12,
  },
  {
    id: "a2",
    title: "Limited Edition Sneakers",
    status: "scheduled",
    startAt: "2025-11-01T09:00:00Z",
    endAt: "2025-11-10T09:00:00Z",
    bids: 0,
  },
  {
    id: "a3",
    title: "Gaming Rig (RTX 4090)",
    status: "draft",
    startAt: null,
    endAt: null,
    bids: 0,
  },
  {
    id: "a4",
    title: "Antique Watch",
    status: "ended",
    startAt: "2025-08-12T14:30:00Z",
    endAt: "2025-09-12T14:30:00Z",
    bids: 37,
  },
  {
    id: "a5",
    title: "Designer Handbag",
    status: "live",
    startAt: "2025-10-18T08:00:00Z",
    endAt: "2025-11-18T08:00:00Z",
    bids: 6,
  },
  {
    id: "a6",
    title: "Rare Comic Set",
    status: "scheduled",
    startAt: "2025-12-01T12:00:00Z",
    endAt: "2025-12-12T12:00:00Z",
    bids: 0,
  },
];

export const statusOrder = { draft: 0, scheduled: 1, live: 2, ended: 3 };

export function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

