import { expect } from 'manten';
import type { FileTree } from 'fs-fixture';
import { nodeResolveExports } from './node-resolve.js';
import { resolveExports, type PathConditions } from '#resolve-pkg-maps';

type AssertionBase = {
	request: string;
	conditions: string[];
	debug?: boolean;
	disableNodeCheck?: boolean;
};

export const resolveExportsWithNode = async ({
	exports,
	files,
	assertions,
}: {
	exports: PathConditions;

	files?: FileTree;

	assertions: ((AssertionBase & { output: string[] }) | (AssertionBase & { error: string }))[];
}) => {
	for (const assertion of assertions) {
		const { request, conditions, debug } = assertion;
		const error = 'error' in assertion ? assertion.error : undefined;
		const output = 'output' in assertion ? assertion.output : undefined;

		let resolved: string[];

		try {
			resolved = resolveExports(exports, request, conditions);
		} catch (resolvedError) {
			if (error) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				expect((resolvedError as any).message).toMatch(error);
				continue;
			}

			throw resolvedError;
		}

		if (error) {
			throw new Error(`Expected to throw error matching ${error}`);
		}

		expect(resolved).toStrictEqual(output);

		let resolvedNode: string | undefined;
		try {
			resolvedNode = await nodeResolveExports(
				exports,
				request,
				conditions,
				files,
			);
		} catch (nodeError) {
			if (error) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				expect((nodeError as any).message).toMatch(error);
				continue;
			}

			throw nodeError;
		}

		if (debug) {
			console.log({ // eslint-disable-line no-console
				request,
				conditions,
				resolved,
				resolvedNode,
			});
		}

		if (error) {
			throw new Error(
				`Expected Node.js to throw error matching ${error}`,
			);
		}

		expect(resolvedNode).toBe(resolved[0]);
	}
};
