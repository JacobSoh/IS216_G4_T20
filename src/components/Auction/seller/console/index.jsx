"use client";

import React from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import SellerDatatable from "@/components/auction/seller/datatable";
import SellerDashboard from "@/components/auction/seller/dashboard";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SellerConsole({ auctions = [] }) {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h1 className={`text-4xl font-bold text-[var(--theme-gold)]`}>
          Seller Console
        </h1>
        <Button variant="brand" onClick={() => redirect('/auction/seller/create')}>Create Auction</Button>
      </div>
      <Tabs defaultValue="manage" className='space-y-6'>
        <TabsList className='w-full'>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <Card>
            <CardContent>
              <SellerDatatable auctions={auctions} />
            </CardContent>
          </Card>

        </TabsContent>
        <TabsContent value="dashboard">
          <SellerDashboard auctions={auctions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
