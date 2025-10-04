"use client";
import Link from "next/link";
import FooterLink from "./FooterLink";

export default function FooterTop() {
    return (
        <div className='text-white border-top max-w-7xl text-center px-4 sm:px-6 lg:px-8 py-5 mx-auto'>
            &copy; 2024 BidHub. All rights reserved.
        </div>
    );
}