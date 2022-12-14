import { testSuite, expect } from 'manten';
import { nodeResolveExports } from '../utils/node-resolve.js';
import { resolveExportsWithNode } from '../utils/resolve-with-node.js';
import { resolveExports } from '#resolve-pkg-maps';

export default testSuite(({ describe }) => {
	describe('star', ({ test }) => {
		test(
			'static match',
			() => resolveExportsWithNode({
				exports: {
					'./*': './file.js',
				},

				assertions: [{
					request: 'any-entry',
					conditions: [],
					output: ['./file.js'],
				}],
			}),
		);

		test(
			'dynamic match - prefix',
			() => resolveExportsWithNode({
				exports: {
					'./prefix/*': './lib/*.js',
				},

				files: {
					'lib/a.js': '',
				},

				assertions: [{
					request: 'prefix/a',
					conditions: [],
					output: ['./lib/a.js'],
				}],
			}),
		);

		test(
			'dynamic match - prefix & suffix',
			() => resolveExportsWithNode({
				exports: {
					'./prefix/*.suffix': './lib/*.mjs',
				},

				files: {
					lib: {
						'a.mjs': '',
						'b.mjs': '',
						'directory/a/b/c.mjs': '',
						'.mjs': '',
					},
				},

				assertions: [
					{
						request: 'prefix/a.suffix',
						conditions: [],
						output: ['./lib/a.mjs'],
					},
					{
						request: 'prefix/b.suffix',
						conditions: [],
						output: ['./lib/b.mjs'],
					},
					{
						request: 'prefix/directory/a/b/c.suffix',
						conditions: [],
						output: ['./lib/directory/a/b/c.mjs'],
					},
				],
			}),
		);

		test(
			'error: shouldnt resolve value-less star',
			async () => {
				const exports = {
					'./prefix/*.suffix': './lib/*.mjs',
				};
				const request = './prefix/.suffix';
				const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'././prefix/.suffix\' is not defined by "exports"';

				expect(
					() => resolveExports(exports, request, []),
				).toThrow(error);

				await expect(
					nodeResolveExports(exports, request, []),
				).rejects.toThrow(error);
			},
		);

		test(
			'multiple stars',
			() => resolveExportsWithNode({
				exports: {
					'./*.ext': './*/src/*.mjs',
				},

				files: {
					'match/src/match.mjs': '',
				},

				assertions: [{
					request: 'match.ext',
					conditions: [],
					output: ['./match/src/match.mjs'],
				}],
			}),
		);

		test(
			'star treated literally if only in path',
			() => resolveExportsWithNode({
				exports: {
					'./file': './lib/*.js',
				},

				files: {
					'lib/*.js': '',
				},

				assertions: [{
					request: 'file',
					conditions: [],
					output: ['./lib/*.js'],
				}],
			}),
		);

		test(
			'export ignored if multiple stars',
			async () => {
				const exports = {
					'./*/*': './file.js',
				};

				const requestInvalid = './dir/file.js';
				const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'././dir/file.js\' is not defined by "exports"';

				expect(
					() => resolveExports(exports, requestInvalid, []),
				).toThrow(error);

				await expect(
					nodeResolveExports(
						exports,
						requestInvalid,
						[],
						{ 'file.js': '' },
					),
				).rejects.toThrow(error);
			},
		);

		test(
			'export ignored if multiple stars',
			async () => {
				const exports = {
					'./**': './file.js',
				};

				const requestInvalid = 'file.js';
				const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'./file.js\' is not defined by "exports"';

				expect(
					() => resolveExports(exports, requestInvalid, []),
				).toThrow(error);

				await expect(
					nodeResolveExports(
						exports,
						requestInvalid,
						[],
						{ 'file.js': '' },
					),
				).rejects.toThrow(error);
			},
		);

		test(
			'path order - null blocks entry',
			async () => {
				const exports = {
					'./*': './*',
					'./internal/*': null,
				};

				const requestValid = 'file.js';
				expect(resolveExports(exports, requestValid, [])).toStrictEqual(['./file.js']);
				await expect(
					await nodeResolveExports(
						exports,
						requestValid,
						[],
						{ 'file.js': '' },
					),
				).toBe('./file.js');

				const requestInvalid = 'internal/file.js';
				const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'./internal/file.js\' is not defined by "exports"';

				expect(
					() => resolveExports(exports, requestInvalid, []),
				).toThrow(error);

				await expect(
					nodeResolveExports(
						exports,
						requestInvalid,
						[],
						{ 'internal/file.js': '' },
					),
				).rejects.toThrow(error);
			},
		);

		test(
			'path order - null blocks entry - same star position (compares entire length)',
			async () => {
				const exports = {
					'./*': './*',
					'./*.js': null,
				};

				const requestValid = 'file.mjs';
				expect(resolveExports(exports, requestValid, [])).toStrictEqual(['./file.mjs']);
				await expect(
					await nodeResolveExports(
						exports,
						requestValid,
						[],
						{ 'file.mjs': '' },
					),
				).toBe('./file.mjs');

				const requestInvalid = 'file.js';
				const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'./file.js\' is not defined by "exports"';

				expect(
					() => resolveExports(exports, requestInvalid, []),
				).toThrow(error);

				await expect(
					nodeResolveExports(
						exports,
						requestInvalid,
						[],
						{ 'file.js': '' },
					),
				).rejects.toThrow(error);
			},
		);

		test(
			'path order - same prefix & length',
			async () => {
				const exports = {
					'./*.cjs': './*.cjs',
					'./*.mjs': null,
				};

				const requestValid = 'file.cjs';
				expect(resolveExports(exports, requestValid, [])).toStrictEqual(['./file.cjs']);
				await expect(
					await nodeResolveExports(
						exports,
						requestValid,
						[],
						{ 'file.cjs': '' },
					),
				).toBe('./file.cjs');

				const requestInvalid = 'file.mjs';
				const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'./file.mjs\' is not defined by "exports"';

				expect(
					() => resolveExports(exports, requestInvalid, []),
				).toThrow(error);

				await expect(
					nodeResolveExports(
						exports,
						requestInvalid,
						[],
						{ 'file.mjs': '' },
					),
				).rejects.toThrow(error);
			},
		);
	});
});
