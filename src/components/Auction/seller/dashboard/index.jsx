"use client";

import React, { useMemo } from "react";

function deriveStatus({ start_time, end_time }) {
  try {
    const now = Date.now();
    const s = start_time ? new Date(start_time).getTime() : null;
    const e = end_time ? new Date(end_time).getTime() : null;
    if (s && now < s) return "scheduled";
    if (s && e && now >= s && now <= e) return "live";
    if (e && now > e) return "ended";
  } catch {}
  return "scheduled";
}

export default function SellerDashboard({ auctions = [] }) {
  const { total, live, scheduled, ended, totalBids } = useMemo(() => {
    const total = (auctions || []).length;
    const statuses = auctions.map(deriveStatus);
    const live = statuses.filter((s) => s === 'live').length;
    const scheduled = statuses.filter((s) => s === 'scheduled').length;
    const ended = statuses.filter((s) => s === 'ended').length;
    const totalBids = auctions.reduce((sum, a) => sum + (a.bids || 0), 0);
    return { total, live, scheduled, ended, totalBids };
  }, [auctions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard label="Total Auctions" value={total} />
      <MetricCard label="Live" value={live} />
      <MetricCard label="Scheduled" value={scheduled} />
      <MetricCard label="Ended" value={ended} />
      <MetricCard label="Total Bids" value={totalBids} />
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-slate-800 rounded-md p-4 border border-slate-700">
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
