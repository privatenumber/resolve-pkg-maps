let firstCall = true;

export async function resolve(
	specifier,
	context,
	nextResolve,
) {
	// Remove default conditions
	context.conditions = context.conditions.slice(3);

	const resolved = await nextResolve(specifier, context, nextResolve);

	if (firstCall) {
		firstCall = false;
	} else {
		console.log(resolved.url);
	}

	return resolved;
}
