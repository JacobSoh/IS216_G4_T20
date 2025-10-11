/* Importing Style or Fonts */
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

/* Importing Components */
import Providers from '@/app/providers'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/utils/supabase/server'

// /* Import Supabase Server For Session */
// import { getServerUser } from '@/utils/auth'

/* Import Session Context */
import { SessionProvider } from '@/context/SessionContext';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
	display: 'swap',
	adjustFontFallback: true
})

export default async function RootLayout({ children }) {
	const cookieStore = await cookies();
	const fullScreen = cookieStore.get('fullscreen')? Boolean(cookieStore.get('fullscreen')) : false;
	
	const sb = await supabaseServer();
	const { data: { user } } = await sb.auth.getUser();
	
	return (
		<html lang="en">
			<body className={`${inter.variable} antialiased bg-linear-(--custom-body-bg) bg-no-repeat text-(--custom-text-primary) leading-[1.6]`}>
				<Providers initialAuthed={!!user} fullScreen={fullScreen}>
					{children}
				</Providers>
			</body>
		</html>
	)
}
