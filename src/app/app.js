/* Importing Style or Fonts */
import { Inter } from 'next/font/google';
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
			<body className={`${inter.variable} antialiased bg-linear-(--custom-body-bg) bg-no-repeat text-(--custom-text-primary) leading-[1.6]`}>
				<Providers initialAuthed={!!session}>
					{children}
				</Providers>
			</body>
		</html>
	)
}
