import { type Stripe } from 'stripe'
import { stripe } from '#app/services/stripe/config.server'
import { getDomainUrl } from '#app/utils/misc'
import { redirectWithToast } from '../../../utils/toast.server'

export async function createStripeCheckoutSession(
	request: Request,
	params?: Stripe.Checkout.SessionCreateParams,
) {
	const HOST_URL = getDomainUrl(request)

	const session = await stripe.checkout.sessions.create({
		line_items: [
			{
				price_data: {
					currency: 'CAD',
					product_data: {
						name: 'APL PEI 2024',
						description:
							'APL Auction is on June 15 and will be played on June 29 and June 30.',
					},
					unit_amount: 5_000,
				},
				quantity: 1,
			},
		],
		mode: 'payment',
		payment_method_types: ['card'],
		success_url: `${HOST_URL}/stripe/success`,
		cancel_url: `${HOST_URL}/stripe/cancel`,
		...params,
	})
	if (!session?.url) {
		throw redirectWithToast('/registration', {
			type: 'error',
			description: 'Failed to create checkout session',
		})
	}

	return session.url
}
