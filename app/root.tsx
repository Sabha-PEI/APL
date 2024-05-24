import {
	json,
	type LoaderFunctionArgs,
	type HeadersFunction,
	type LinksFunction,
	type MetaFunction,
} from '@remix-run/node'
import {
	Link,
	Links,
	Meta,
	NavLink,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from '@remix-run/react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { Confetti } from './components/confetti.tsx'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { useToast } from './components/toaster.tsx'
import { href as iconsHref } from './components/ui/icon.tsx'
import { EpicToaster } from './components/ui/sonner.tsx'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'
import { getPlayerId, logout } from './utils/auth.server.ts'
import { ClientHintCheck, getHints, useHints } from './utils/client-hints.tsx'
import { getConfetti } from './utils/confetti.server.ts'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { useRequestInfo } from './utils/request-info.ts'
import { type Theme, getTheme } from './utils/theme.server.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server.ts'

export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconsHref, as: 'image' },
		{ rel: 'preload', href: '/img/logo.png', as: 'image' },
		// Preload CSS as a resource to avoid render blocking
		{
			rel: 'alternate icon',
			type: 'image/png',
			href: '/favicons/favicon-32x32.png',
		},
		{ rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
	].filter(Boolean)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data ? 'APL PEI 2024' : 'Error | APL PEI 2024' },
		{ name: 'description', content: `Atmiya Premiere League in PEI` },
	]
}

export async function loader({ request }: LoaderFunctionArgs) {
	const timings = makeTimings('root loader')
	const playerId = await time(() => getPlayerId(request), {
		timings,
		type: 'getUserId',
		desc: 'getUserId in root',
	})

	const player = playerId
		? await time(
				() =>
					prisma.player.findUniqueOrThrow({
						select: {
							id: true,
							firstName: true,
							lastName: true,
							image: { select: { id: true } },
						},
						where: { id: playerId },
					}),
				{ timings, type: 'find player', desc: 'find player in root' },
			)
		: null
	if (playerId && !player) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await logout({ request, redirectTo: '/' })
	}
	const { toast, headers: toastHeaders } = await getToast(request)
	const { confettiId, headers: confettiHeaders } = getConfetti(request)
	const honeyProps = honeypot.getInputProps()

	return json(
		{
			player,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
			toast,
			confettiId,
			honeyProps,
		},
		{
			headers: combineHeaders(
				{ 'Server-Timing': timings.toString() },
				toastHeaders,
				confettiHeaders,
			),
		},
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
	allowIndexing = true,
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	env?: Record<string, string>
	allowIndexing?: boolean
}) {
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{allowIndexing ? null : (
					<meta name="robots" content="noindex, nofollow" />
				)}
				<Links />
			</head>
			<body className="bg-background text-foreground">
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const nonce = useNonce()
	const theme = useTheme()
	const allowIndexing = data.ENV.ALLOW_INDEXING !== 'false'
	useToast(data.toast)

	return (
		<Document
			nonce={nonce}
			theme={theme}
			allowIndexing={allowIndexing}
			env={data.ENV}
		>
			<div className="flex h-full min-h-screen flex-col justify-between">
				<header className="container py-6">
					<nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
						<Logo />
						<ul>
							{data.player ? (
								<li>
									<NavLink
										to="/admin"
										className={({ isActive }) =>
											isActive ? 'font-bold underline' : ''
										}
									>
										Admin
									</NavLink>
								</li>
							) : (
								<li>
									<NavLink
										to="/registration"
										className={({ isActive }) =>
											isActive ? 'font-bold underline' : ''
										}
									>
										Register
									</NavLink>
								</li>
							)}
						</ul>
					</nav>
				</header>

				<Outlet />
			</div>
			<Confetti id={data.confettiId} />
			<EpicToaster closeButton position="top-center" theme={theme} />
			<EpicProgress />
		</Document>
	)
}

function Logo() {
	return (
		<Link to="/" className="group flex items-center gap-4">
			<img src="/img/logo.png" alt="APL PEI 2024" className="w-14" />
			<span className="grid leading-snug">
				<span className="font-light transition group-hover:-translate-x-1">
					APL
				</span>
				<span className="font-bold transition group-hover:translate-x-1">
					PEI
				</span>
			</span>
		</Link>
	)
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeyProps}>
			<App />
		</HoneypotProvider>
	)
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
	const hints = useHints()
	const requestInfo = useRequestInfo()

	return requestInfo.userPrefs.theme ?? hints.theme
}

export function ErrorBoundary() {
	// the nonce doesn't rely on the loader so we can access that
	const nonce = useNonce()

	// NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
	// likely failed to run so we have to do the best we can.
	// We could probably do better than this (it's possible the loader did run).
	// This would require a change in Remix.

	// Just make sure your root route never errors out and you'll always be able
	// to give the user a better UX.

	return (
		<Document nonce={nonce}>
			<GeneralErrorBoundary />
		</Document>
	)
}
