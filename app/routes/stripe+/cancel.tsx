import { redirectWithToast } from '../../utils/toast.server'

// redirect with toast for better UX
export async function loader() {
	return redirectWithToast('/registration', {
		type: 'message',
		description: 'Your payment was cancelled.',
	})
}
