import { isObject } from './utils/is-object.js';
import { createError } from './utils/create-error.js';
import { resolveConditions, Type } from './utils/resolve-conditions.js';
import { findMatchingPath } from './utils/find-matching-map-entry.js';
import {
	ERR_INVALID_PACKAGE_CONFIG,
	ERR_INVALID_PACKAGE_TARGET,
	ERR_PACKAGE_PATH_NOT_EXPORTED,
} from './utils/errors.js';
import type { PathConditions, PathConditionsMap } from './types.js';

const isConditionalObject = (
	exportsMap: PathConditionsMap,
) => Object.keys(exportsMap).reduce<boolean | undefined>(
	(firstKey, key) => {
		const isKeyConditionalSugar = key === '' || key[0] !== '.';

		if (
			firstKey === undefined
			|| firstKey === isKeyConditionalSugar
		) {
			return isKeyConditionalSugar;
		}

		throw createError(
			ERR_INVALID_PACKAGE_CONFIG,
			'"exports" cannot contain some keys starting with "." and some not',
		);
	},
	undefined,
);

const hasProtocolPattern = /^\w+:/;

// Based on https://github.com/nodejs/node/blob/v18.8.0/lib/internal/modules/esm/resolve.js#L549
export const resolveExports = (
	exports: PathConditions,
	request: string,
	conditions: readonly string[],
): string[] => {
	if (!exports) {
		throw new Error('"exports" is required');
	}

	request = request === '' ? '.' : `./${request}`;

	// https://github.com/nodejs/node/blob/v18.7.0/lib/internal/modules/esm/resolve.js#L651-L652
	if (
		typeof exports === 'string'
		|| Array.isArray(exports)
		|| (isObject(exports) && isConditionalObject(exports))
	) {
		exports = { '.': exports };
	}

	const [pathMatch, starMatch] = findMatchingPath(exports, request);

	const resolved = resolveConditions(
		Type.Export,
		exports[pathMatch as string],
		request,
		conditions,
		starMatch,
	);

	if (resolved.length === 0) {
		throw createError(
			ERR_PACKAGE_PATH_NOT_EXPORTED,
			request === '.'
				? 'No "exports" main defined'
				: `Package subpath '${request}' is not defined by "exports"`,
		);
	}

	for (const resolvedPath of resolved) {
		if (
			!resolvedPath.startsWith('./')
			&& !hasProtocolPattern.test(resolvedPath)
		) {
			throw createError(
				ERR_INVALID_PACKAGE_TARGET,
				`Invalid "exports" target "${resolvedPath}" defined in the package config`,
			);
		}
	}

	return resolved;
};
