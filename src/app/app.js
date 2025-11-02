/* Importing Style or Fonts */
import { Inter } from 'next/font/google';
import Script from 'next/script';
import '@/styles/globals.css';

/* Importing Components */
import Providers from '@/app/providers';
import { supabaseServer } from '@/utils/supabase/server';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
	display: 'swap',
	adjustFontFallback: true
})

export default async function RootLayout({ children }) {

	const sb = await supabaseServer();
	const { data: { session } } = await sb.auth.getSession();

    return (
		<html lang="en">
			<head>
				<link rel="preconnect" href="https://cdn.withpersona.com" crossOrigin="anonymous" />
				<link rel="dns-prefetch" href="//cdn.withpersona.com" />
			</head>
			<body className={`${inter.variable} antialiased bg-background text-foreground leading-[1.6]`}>
				<Providers initialAuthed={!!session}>
					{children}
				</Providers>
				<Script
				  src="https://cdn.withpersona.com/dist/persona-v5.1.2.js"
				  integrity="sha384-nuMfOsYXMwp5L13VJicJkSs8tObai/UtHEOg3f7tQuFWU5j6LAewJbjbF5ZkfoDo"
				  crossOrigin="anonymous"
				  strategy="beforeInteractive"
				/>
			</body>
		</html>
	)
}
