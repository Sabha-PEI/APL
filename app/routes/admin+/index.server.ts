export function getIframeSrc() {
	const isProd = process.env.NODE_ENV === 'production'
	const protocol = isProd ? 'https' : 'http'
	const domain = isProd ? process.env.DOMAIN : 'localhost'
	return `${protocol}://${domain}:3690`
}
