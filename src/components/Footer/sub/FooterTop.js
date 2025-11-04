"use client";
import FooterLink from "./FooterLink";

const navigation = [
    {
        title: 'Quick Links',
        links: [
            { name: 'Live Auctons', href: '/' },
            { name: 'Categories', href: '/categories' },
            { name: 'How It Works', href: '/how_it_works' },
            { name: 'Selling Guide', href: '/about' }
        ]
    },
    {
        title: 'Support',
        links: [
            { name: 'Help Center', href: '/' },
            { name: 'Contact Us', href: '/categories' },
            { name: 'Terms of Service', href: '/how_it_works' },
            { name: 'Privacy Policy', href: '/about' }
        ]
    },
    {
        title: 'Contact',
        links: [
            { name: 'Twitter', href: '/' },
            { name: 'Instagram', href: '/categories' },
            { name: 'Facebook', href: '/how_it_works' },
            { name: 'Newsletter', href: '/about' }
        ]
    }
];

export default function FooterTop() {
    return (navigation.map(v => <FooterLink key={`${v.title}_footer`} title={v.title} links={v.links} />));
}
