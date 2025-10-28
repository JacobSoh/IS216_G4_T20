"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import SellerDatatable from "@/components/auction/seller/datatable";
import SellerDashboard from "@/components/auction/seller/dashboard";

export default function SellerConsole({ auctions = [] }) {
  console.log(auctions);
  const router = useRouter();
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-brand">Seller Console</h2>
        <Button variant="brand" onClick={() => router.push('/auction/seller/create')}>Create Auction</Button>
      </div>

      <div className="bg-slate-800 rounded-md overflow-hidden shadow-xl border border-slate-700">
        <div className="m-4">
          <Tabs defaultValue="manage">
            <TabsList>
              <TabsTrigger value="manage">Manage</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
            <TabsContent value="manage">
              <SellerDatatable auctions={auctions} />
            </TabsContent>
            <TabsContent value="dashboard">
              <SellerDashboard auctions={auctions} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
