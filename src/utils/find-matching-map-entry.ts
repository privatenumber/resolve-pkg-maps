import type { PathConditions } from '../types.js';

const STAR = '*';

const hasHigherSpecificity = (
	keyA: string,
	keyB: string,
) => {
	const starIndexA = keyA.indexOf(STAR);
	const starIndexB = keyB.indexOf(STAR);

	return (
		starIndexA === starIndexB
			? keyB.length > keyA.length
			: starIndexB > starIndexA
	);
};

export function findMatchingPath(
	pathConditions: PathConditions,
	request: string,
) {
	if (
		!request.includes(STAR)
		&& pathConditions.hasOwnProperty(request)
	) {
		return [request];
	}

	let pathMatch: string | undefined;
	let starMatch: string | undefined;
	for (const exportPath of Object.keys(pathConditions)) {
		if (exportPath.includes(STAR)) {
			const [prefix, suffix, remaining] = exportPath.split(STAR);

			if (
				remaining === undefined
				&& request.startsWith(prefix)
				&& request.endsWith(suffix)
			) {
				const currentStarMatch = request.slice(
					prefix.length,
					-suffix.length || undefined,
				);

				if (
					currentStarMatch
					&& (
						!pathMatch
						|| hasHigherSpecificity(pathMatch, exportPath)
					)
				) {
					pathMatch = exportPath;
					starMatch = currentStarMatch;
				}
			}
		}
	}

	return [pathMatch, starMatch];
}
