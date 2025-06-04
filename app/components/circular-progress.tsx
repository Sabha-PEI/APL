import { useEffect, useState } from 'react'

interface CircularProgressProps {
	value: number
	size?: number
	strokeWidth?: number
	className?: string
}

export function CircularProgress({
	value = 9,
	size = 320,
	strokeWidth = 32,
	className = '',
}: CircularProgressProps) {
	const [animatedPercentage, setAnimatedPercentage] = useState(0)

	const radius = (size - strokeWidth) / 2
	const circumference = radius * 2 * Math.PI
	const strokeDasharray = circumference
	const strokeDashoffset =
		circumference - (animatedPercentage / 100) * circumference

	useEffect(() => {
		const timer = setTimeout(() => {
			setAnimatedPercentage(value * 10)
		}, 100)
		return () => clearTimeout(timer)
	}, [value])

	return (
		<div className={`inline-flex items-center justify-center ${className}`}>
			<div className="relative" style={{ width: size, height: size }}>
				<svg
					width={size}
					height={size}
					className="-rotate-90 transform"
					viewBox={`0 0 ${size} ${size}`}
				>
					<defs>
						<linearGradient
							id="progressGradient"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="0%"
						>
							<stop offset="0%" stopColor="#43C6EF" />
							<stop offset="100%" stopColor="#3780EB" />
						</linearGradient>
					</defs>

					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="#374151"
						strokeWidth={strokeWidth}
						fill="transparent"
						className="opacity-30"
					/>

					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="url(#progressGradient)"
						strokeWidth={strokeWidth}
						fill="transparent"
						strokeDasharray={strokeDasharray}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="round"
						className="transition-all duration-1000 ease-out"
					/>
				</svg>

				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-7xl font-bold text-white">{value}</span>
				</div>
			</div>
		</div>
	)
}
