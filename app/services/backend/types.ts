export type Player = {
	id: number
	name: string
	email: string
	phone: number
	mandal: string
	battingRating: number
	bowlingRating: number
	fieldingRating: number
	playerSold: boolean
	playerImageUrl: string
	teamId: number
	noOfMatches: number
	noOfRuns: number
	strikeRate: number
	noOfWickets: number
	noOfDismissals: number
	noOfCatches: number
	typeof: string
	playerSoldAmount: number
}

export type Team = {
	id: number
	teamName: string
	teamImageUrl: string
	players: Player[]
}
