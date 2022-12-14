export const createError = (
	code: string,
	message: string,
): Error & { code: string } => Object.assign(
	new Error(`[${code}]: ${message}`),
	{ code },
);
