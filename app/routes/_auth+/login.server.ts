import { redirect } from '@remix-run/node'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { sessionKey } from '#app/utils/auth.server.ts'
import { combineResponseInits } from '#app/utils/misc.tsx'
import { authSessionStorage } from '#app/utils/session.server.ts'

export async function handleNewSession(
	{
		request,
		session,
		redirectTo,
		remember,
	}: {
		request: Request
		session: { playerId: string; id: string; expirationDate: Date }
		redirectTo?: string
		remember: boolean
	},
	responseInit?: ResponseInit,
) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	authSession.set(sessionKey, session.id)

	return redirect(
		safeRedirect(redirectTo, '/admin'),
		combineResponseInits(
			{
				headers: {
					'set-cookie': await authSessionStorage.commitSession(authSession, {
						expires: remember ? session.expirationDate : undefined,
					}),
				},
			},
			responseInit,
		),
	)
}
