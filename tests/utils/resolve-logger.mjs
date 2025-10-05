let firstCall = true;

export const resolve = async (
	specifier,
	context,
	nextResolve,
) => {
	// Remove default conditions
	context.conditions = context.conditions.slice(3);

	const resolved = await nextResolve(specifier, context, nextResolve);

	if (firstCall) {
		firstCall = false;
	} else {
		console.log(resolved.url); // eslint-disable-line no-console
	}

	return resolved;
};
