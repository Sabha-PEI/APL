import { type HeadersFunction, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { Button } from '../../components/ui/button'
import { requirePlayerId } from '../../utils/auth.server'
import { getIframeSrc } from './index.server'

export const headers: HeadersFunction = () => {
	const iframeSrc = getIframeSrc()
	return {
		'Content-Security-Policy': `frame-src 'self' ${iframeSrc}`,
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	return { iframeSrc: getIframeSrc() }
}

export default function Index() {
	const { iframeSrc } = useLoaderData<typeof loader>()

	return (
		<main className="mt-128 container flex flex-1 flex-col place-items-center">
			<h1 className="text-4xl font-bold">Admin Panel</h1>

			<Form method="POST" action="/logout" className="mt-3">
				<Button type="submit">Logout</Button>
			</Form>

			<div className="mt-5 flex w-full flex-1 flex-col pb-20">
				<iframe
					title="Prisma Studio"
					src={iframeSrc}
					width="100%"
					height="100%"
					className="flex-1"
					allowFullScreen
				></iframe>
			</div>
		</main>
	)
}
