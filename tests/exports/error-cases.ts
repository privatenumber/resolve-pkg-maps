import { testSuite, expect } from 'manten';
import { nodeResolveExports } from '../utils/node-resolve.js';
import { resolveExports } from '#resolve-pkg-maps';

export default testSuite(({ describe }) => {
	describe('error cases', ({ describe }) => {
		describe('invalid exports', ({ test }) => {
			test(
				'mixing conditional with paths',
				async () => {
					const exports = {
						'.': './index.js',
						condition: './index.js',
					};
					const expectedError = '"exports" cannot contain some keys starting with';

					expect(() => resolveExports(exports, '', [])).toThrow(expectedError);
					await expect(nodeResolveExports(exports, '', [])).rejects.toThrow(expectedError);
				},
			);

			test(
				'numeric value',
				async () => {
					const exports = { '.': 1 };

					// @ts-expect-error number type
					expect(() => resolveExports(exports, '', [])).toThrow('Invalid "exports" target "1"');

					// @ts-expect-error invalid exports
					await expect(nodeResolveExports(exports, '', [])).rejects.toThrow('Invalid "exports" main target "1"');
				},
			);

			test(
				'boolean value',
				async () => {
					const exports = { '.': true };

					// @ts-expect-error number type
					expect(() => resolveExports(exports, '', [])).toThrow('[ERR_INVALID_PACKAGE_TARGET]: Invalid "exports" target "true"');

					// @ts-expect-error invalid exports
					await expect(nodeResolveExports(exports, '', [])).rejects.toThrow('[ERR_INVALID_PACKAGE_TARGET]: Invalid "exports" main target "true"');
				},
			);

			test(
				'numeric keys',
				async () => {
					const exports = { 0: './index.js' };
					const error = 'annot contain numeric property keys';

					expect(() => resolveExports(exports, '', [])).toThrow(error);
					await expect(nodeResolveExports(exports, '', [])).rejects.toThrow(error);
				},
			);

			test(
				'path doesnt start with ./',
				async () => {
					const target = 'entry';
					const exports = { './entry': target };
					const error = `[ERR_INVALID_PACKAGE_TARGET]: Invalid "exports" target "${target}"`;

					expect(() => resolveExports(exports, 'entry', [])).toThrow(error);
					await expect(nodeResolveExports(exports, 'entry', [])).rejects.toThrow(error);
				},
			);

			test(
				'./ in middle of path',
				async () => {
					const target = './lib/./entry.js';
					const exports = { './entry': target };
					const error = `[ERR_INVALID_PACKAGE_TARGET]: Invalid "exports" target "${target}"`;

					expect(() => resolveExports(exports, 'entry', [])).toThrow(error);
					await expect(nodeResolveExports(exports, 'entry', [])).rejects.toThrow(error);
				},
			);

			test(
				'starts with ..',
				async () => {
					const target = '../entry';
					const exports = { './entry': target };
					const error = `[ERR_INVALID_PACKAGE_TARGET]: Invalid "exports" target "${target}"`;

					expect(() => resolveExports(exports, 'entry', [])).toThrow(error);
					await expect(nodeResolveExports(exports, 'entry', [])).rejects.toThrow(error);
				},
			);

			test(
				'../ in middle of path',
				async () => {
					const target = './lib/../entry.js';
					const exports = { './entry': target };
					const error = `[ERR_INVALID_PACKAGE_TARGET]: Invalid "exports" target "${target}"`;

					expect(() => resolveExports(exports, 'entry', [])).toThrow(error);
					await expect(nodeResolveExports(exports, 'entry', [])).rejects.toThrow(error);
				},
			);

			test(
				'node_modules in path',
				async () => {
					const target = './lib/node_modules/entry.js';
					const exports = { './entry': target };
					const error = `[ERR_INVALID_PACKAGE_TARGET]: Invalid "exports" target "${target}"`;

					expect(() => resolveExports(exports, 'entry', [])).toThrow(error);
					await expect(nodeResolveExports(exports, 'entry', [])).rejects.toThrow(error);
				},
			);

			test(
				'case insensitive node_modules in path',
				async () => {
					const target = './lib/NODE_MODULES/entry.js';
					const exports = { './entry': target };
					const error = `[ERR_INVALID_PACKAGE_TARGET]: Invalid "exports" target "${target}"`;

					expect(() => resolveExports(exports, 'entry', [])).toThrow(error);
					await expect(nodeResolveExports(exports, 'entry', [])).rejects.toThrow(error);
				},
			);
		});

		describe('throws on null exports', ({ test }) => {
			test(
				'falls back to package.json#main',
				async () => {
					const exports = null;
					const request = '';

					expect(
						// @ts-expect-error invalid exports
						() => resolveExports(exports, request, []),
					).toThrow('"exports" is required');

					// Node.js resolves to main
					expect(
						await nodeResolveExports(
							'manually created below',
							request,
							[],
							{
								'entry.js': '',
								'package.json': JSON.stringify({
									main: './entry.js',
									exports: null,
								}),
							},
						),
					).toBe('./entry.js');
				},
			);

			test(
				'resolves subpath',
				async () => {
					const exports = null;
					const request = 'non-existent-export.js';

					expect(
						// @ts-expect-error invalid exports
						() => resolveExports(exports, request, []),
					).toThrow('"exports" is required');

					expect(
						await nodeResolveExports(
							// @ts-expect-error invalid exports
							exports,
							request,
							[],
							{ 'non-existent-export.js': '' },
						),
					).toBe('./non-existent-export.js');
				},
			);
		});

		describe('missing export', ({ test }) => {
			test(
				'non-existent export',
				async () => {
					const exports = './entry.js';
					const request = 'non-existent-export';
					const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'./non-existent-export\' is not defined by "exports"';

					expect(
						() => resolveExports(exports, request, []),
					).toThrow(error);

					await expect(
						nodeResolveExports(exports, request, []),
					).rejects.toThrow(error);
				},
			);

			test(
				'null path',
				async () => {
					const exports = { './entry.js': null };
					const request = 'entry.js';
					const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'./entry.js\' is not defined by "exports"';

					expect(
						() => resolveExports(exports, request, []),
					).toThrow(error);

					await expect(
						nodeResolveExports(
							exports,
							request,
							[],
							{ 'entry.js': '' },
						),
					).rejects.toThrow(error);
				},
			);
		});
	});
});
