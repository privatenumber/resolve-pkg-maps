import path from 'path';
import { fileURLToPath } from 'node:url';
import { execaNode } from 'execa';
import { createFixture, type FileTree } from 'fs-fixture';
import type { PathConditions, PathConditionsMap } from '#resolve-pkg-maps';

const loaderPath = path.resolve('./tests/utils/resolve-logger.mjs');

const packagePath = 'node_modules/package/';

const loaderWarning = 'to show where the warning was created)';

export async function nodeResolve(
	files: FileTree,
	request: string,
	conditions: readonly string[],
) {
	const fixture = await createFixture({
		...files,
		'resolve.mjs': `import '${request}'`,
	});

	const nodeProcess = await execaNode(
		'./resolve.mjs',
		[],
		{
			nodeOptions: [
				'--loader',
				loaderPath,
				...conditions.map(condition => `--conditions=${condition}`),
			],
			cwd: fixture.path,
			reject: false,
		},
	);

	await fixture.rm();

	const stderr = nodeProcess.stderr.slice(
		nodeProcess.stderr.indexOf(loaderWarning) + loaderWarning.length,
	);

	if (stderr) {
		throw new Error(stderr);
	}

	if (nodeProcess.stdout) {
		return fileURLToPath(nodeProcess.stdout).replace(
			path.join(fixture.path),
			'.',
		);
	}
}

function normalizeExports(
	exports: PathConditions,
): PathConditionsMap {
	if (
		!exports
		|| typeof exports === 'string'
		|| Array.isArray(exports)
		|| (
			exports
			&& typeof exports === 'object'

			// If condition object
			&& Object.keys(exports).every(key => key === '' || key[0] !== '.')
		)
	) {
		return { '.': exports };
	}

	return exports;
}

const getMapPaths = (
	exports: PathConditions | null,
): string[] => {
	if (!exports) {
		return [];
	}

	if (typeof exports === 'string') {
		return exports.includes('*') ? [] : [exports];
	}

	return (
		Array.isArray(exports)
			? exports
			: Object.values(exports)
	).flatMap(getMapPaths);
};

export async function nodeResolveExports(
	exports: PathConditions,
	request: string,
	conditions: readonly string[],
	files?: FileTree,
) {
	if (!files) {
		// Generate files from export map
		files = Object.fromEntries(
			getMapPaths(
				normalizeExports(exports),
			)
				.filter(filePath => filePath !== './non-existent.js')
				.map(filePath => [filePath, '']),
		);
	}

	const resolved = await nodeResolve(
		{
			[packagePath]: {
				'package.json': JSON.stringify({ exports }),
				...files,
			},
		},
		`package${request ? `/${request}` : ''}`,
		conditions,
	);

	if (resolved) {
		return resolved.replace(packagePath, '');
	}
}

export async function nodeResolveImports(
	imports: PathConditionsMap,
	request: string,
	conditions: readonly string[],
	files?: FileTree,
) {
	if (!files) {
		// Generate files from import map
		files = Object.fromEntries(
			getMapPaths(imports).map(filePath => [filePath, '']),
		);
	}

	return await nodeResolve(
		{
			'package.json': JSON.stringify({ imports }),
			...files,
		},
		request,
		conditions,
	);
}
