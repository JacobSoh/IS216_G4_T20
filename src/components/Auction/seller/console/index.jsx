"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import SellerDatatable from "@/components/Auction/seller/datatable";
import SellerDashboard from "@/components/Auction/seller/dashboard";
import getProfile from "@/hooks/getProfile";
import VerifyButton from "@/components/Persona";
import { Spinner as UISpinner } from '@/components/ui/spinner';

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
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const u = await getProfile();
        if (!active) return;
        setUser(u);
        setIsVerified(Boolean(u?.verified));
      } catch (e) {
        if (!active) return;
        setError(e?.message || "Failed to retrieve profile");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className='space-y-12'>
        <div className="flex items-start justify-between">
          <h1 className={`text-4xl font-bold text-[var(--theme-gold)]`}>
            Seller Console
          </h1>
          <Button variant="brand" loadingOnClick={true} disabled={!isVerified} onClick={() => {
            return window.location.href = '/auction/seller/create';
          }}>Create Auction</Button>
        </div>
        <div className="flex items-center justify-center py-20 text-[var(--theme-gold)]">
          <UISpinner className='mr-2' /> Fetching your informtion!
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-12'>
      <div className="flex items-start justify-between">
        <h1 className={`text-4xl font-bold text-[var(--theme-gold)]`}>
          Seller Console
        </h1>
        <Button variant="brand" loadingOnClick={true} disabled={!isVerified} onClick={() => {
          return window.location.href = '/auction/seller/create';
        }}>Create Auction</Button>
      </div>
      {!isVerified && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Seller Verification Required</CardTitle>
            <CardDescription>
              {error ? "We couldn’t confirm your verification status." : "Please complete identity verification to access seller tools."}
            </CardDescription>
            <CardAction>
              <VerifyButton id={user?.id} variant="brand" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--theme-cream)] mb-4">
              Launch the verification flow below. After completion, it may take up to a few minutes to reflect.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" className='w-full' onClick={() => { window.location.reload(); }}>
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Tabs defaultValue="manage" className={`${!isVerified ? 'hidden' : ''} space-y-6`}>
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
