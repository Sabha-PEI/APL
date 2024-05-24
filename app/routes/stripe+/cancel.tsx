import { type LoaderFunctionArgs } from '@remix-run/node'
import { redirectWithToast } from '../../utils/toast.server'

// redirect with toast for better UX
export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const id = url.searchParams.get('id')

	return redirectWithToast(`/registration?id=${id}&pay=canceled`, {
		type: 'message',
		description: 'Your payment was cancelled.',
	})
}
