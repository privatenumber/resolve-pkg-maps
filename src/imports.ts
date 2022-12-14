import { resolveConditions, Type } from './utils/resolve-conditions.js';
import { findMatchingPath } from './utils/find-matching-map-entry.js';
import { createError } from './utils/create-error.js';
import { ERR_PACKAGE_IMPORT_NOT_DEFINED } from './utils/errors.js';
import type { PathConditionsMap } from './types.js';

// Based on https://github.com/nodejs/node/blob/v18.8.0/lib/internal/modules/esm/resolve.js#L642
export const resolveImports = (
	imports: PathConditionsMap,
	request: string,
	conditions: readonly string[],
): string[] => {
	if (!imports) {
		throw new Error('"imports" is required');
	}

	const [pathMatch, starMatch] = findMatchingPath(imports, request);

	const resolved = resolveConditions(
		Type.Import,
		imports[pathMatch as string],
		request,
		conditions,
		starMatch,
	);

	if (resolved.length === 0) {
		throw createError(
			ERR_PACKAGE_IMPORT_NOT_DEFINED,
			`Package import specifier "${request}" is not defined in package`,
		);
	}

	return resolved;
};
