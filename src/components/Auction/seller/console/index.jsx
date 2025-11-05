"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import SellerDatatable from "@/components/Auction/seller/datatable";
import SellerDashboard from "@/components/Auction/seller/dashboard";

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
      <div className="flex items-start justify-between mr-15">
        <h1 className={`text-4xl font-bold text-[var(--theme-gold)]`}>
          Seller Console
        </h1>
        <Button variant="brand" loadingOnClick={true} className="h-11 -translate-y-2" onClick={() => window.location.href = '/auction/seller/create'}>Create Auction</Button>
      </div>
      <Tabs defaultValue="manage" className='space-y-6'>
        <TabsList className='w-full'>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <Card variant='default'>
            <CardContent>
              <SellerDatatable auctions={auctions} />
            </CardContent>
          </Card>

        </TabsContent>
        <TabsContent value="dashboard">
          <Card variant='default'>
            <CardContent>
              <SellerDashboard auctions={auctions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
