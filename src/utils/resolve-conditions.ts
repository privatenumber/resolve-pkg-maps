import type { PathConditions } from '../types.js';
import { isObject } from './is-object.js';
import { createError } from './create-error.js';
import { ERR_INVALID_PACKAGE_CONFIG, ERR_INVALID_PACKAGE_TARGET } from './errors.js';

const isInteger = /^\d+$/;

// eslint-disable-next-line regexp/no-unused-capturing-group
const disallowedPathSegments = /^(\.{1,2}|node_modules)$/i;

const pathSeparator = /\/|\\/;

export enum Type {
	Export = 'exports',
	Import = 'imports',
}

export const resolveConditions = (
	type: Type,
	pathConditions: PathConditions | null,
	request: string,
	conditions: readonly string[],
	asterisk?: string,
): string[] => {
	/**
	 * Handle null or undefined
	 * Null is an acceptable value in export maps.
	 * undefined can will be passed in if there is no path match
	 * in exports or imports.
	 */
	// eslint-disable-next-line no-eq-null
	if (pathConditions == null) {
		return [];
	}

	if (typeof pathConditions === 'string') {
		const [firstSegment, ...pathSegments] = pathConditions.split(pathSeparator);

		if (
			firstSegment === '..'
			|| pathSegments.some(
				segment => disallowedPathSegments.test(segment),
			)
		) {
			throw createError(
				ERR_INVALID_PACKAGE_TARGET,
				`Invalid "${type}" target "${pathConditions}" defined in the package config`,
			);
		}

		return [
			asterisk
				? pathConditions.replace(/\*/g, asterisk)
				: pathConditions,
		];
	}

	if (Array.isArray(pathConditions)) {
		return pathConditions
			.flatMap(
				pathCondition => resolveConditions(
					type,
					pathCondition,
					request,
					conditions,
					asterisk,
				),
			);
	}

	if (isObject(pathConditions)) {
		for (const condition of Object.keys(pathConditions)) {
			if (isInteger.test(condition)) {
				throw createError(
					ERR_INVALID_PACKAGE_CONFIG,
					'Cannot contain numeric property keys',
				);
			}

			if (
				condition === 'default'
				|| conditions.includes(condition)
			) {
				return resolveConditions(
					type,
					pathConditions[condition],
					request,
					conditions,
					asterisk,
				);
			}
		}
		return [];
	}

	throw createError(
		ERR_INVALID_PACKAGE_TARGET,
		`Invalid "${type}" target "${pathConditions}"`,
	);
};
