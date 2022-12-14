import { testSuite, expect } from 'manten';
// @ts-expect-error broken types
import { resolve as lukeedResolve } from 'resolve.exports';
import { nodeResolveExports } from '../utils/node-resolve.js';
import { resolveExports } from '#resolve-pkg-maps';

export default testSuite(({ describe }) => {
	describe('compare with resolve.exports', ({ test }) => {
		// https://github.com/lukeed/resolve.exports/issues/19
		test(
			'request starting with .',
			async () => {
				const packageJson = {
					exports: {
						'./.hidden': './file.js',
					},
				};
				const request = '.hidden';
				const conditions = ['worker', 'node'];

				// lukeed/resolve.exports: Fails
				expect(() => {
					lukeedResolve(packageJson, request, { conditions });
				}).toThrow('Missing ".hidden" export in "undefined" package');

				// resolve-pkg-maps: Passes
				expect(
					resolveExports(packageJson.exports, request, conditions),
				).toStrictEqual(['./file.js']);

				// Node.js: Expected behavior
				expect(
					await nodeResolveExports(
						packageJson.exports,
						request,
						conditions,
					),
				).toBe('./file.js');
			},
		);

		// https://github.com/lukeed/resolve.exports/issues/16
		test(
			'null target exclusion',
			async () => {
				const packageJson = {
					exports: {
						'./*': './*',
						'./file.js': null,
					},
				};
				const request = 'file.js';
				const conditions = ['worker', 'node'];

				// lukeed/resolve.exports: Fails - should be blocked
				expect(
					lukeedResolve(packageJson, request, { conditions }),
				).toBe('./file.js');

				const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'./file.js\' is not defined by "exports"';

				// resolve-pkg-maps: Passes
				expect(
					() => resolveExports(packageJson.exports, request, conditions),
				).toThrow(error);

				// Node.js: Expected behavior
				await expect(
					nodeResolveExports(
						packageJson.exports,
						request,
						conditions,
						{ '/file.js': '' },
					),
				).rejects.toThrow(error);
			},
		);

		// https://github.com/lukeed/resolve.exports/issues/17
		test(
			'fallback array',
			async () => {
				const packageJson = {
					exports: {
						'./file': ['http://a.com', './file.js'],
					},
				};
				const request = 'file';
				const conditions = ['worker', 'node'];

				// lukeed/resolve.exports: Fails - should leave fallback to user to handle
				expect(
					lukeedResolve(packageJson, request, { conditions }),
				).toBe('http://a.com');

				// resolve-pkg-maps: Passes - Leaves fallback up to user to handle
				expect(
					resolveExports(packageJson.exports, request, conditions),
				).toStrictEqual(['http://a.com', './file.js']);

				// Node.js: Expected behavior
				expect(
					await nodeResolveExports(
						packageJson.exports,
						request,
						conditions,
					),
				).toBe('./file.js');
			},
		);

		// https://github.com/lukeed/resolve.exports/issues/22
		test(
			'star with suffix',
			async () => {
				const packageJson = {
					exports: {
						'./*.js': './*.js',
					},
				};
				const request = 'file.js';
				const conditions = ['worker', 'node'];

				// lukeed/resolve.exports: Fails - should resolve
				expect(() => {
					lukeedResolve(packageJson, request, { conditions });
				}).toThrow('Missing "./file.js" export in "undefined" package');

				// resolve-pkg-maps: Passes - Leaves fallback up to user to handle
				expect(
					resolveExports(packageJson.exports, request, conditions),
				).toStrictEqual(['./file.js']);

				// Node.js: Expected behavior
				expect(
					await nodeResolveExports(
						packageJson.exports,
						request,
						conditions,
						{ '/file.js': '' },
					),
				).toBe('./file.js');
			},
		);

		// https://github.com/lukeed/resolve.exports/issues/9
		test(
			'multiple stars',
			async () => {
				const packageJson = {
					exports: {
						'./*.js': './*/*.js',
					},
				};
				const request = 'file.js';
				const conditions = ['worker', 'node'];

				// lukeed/resolve.exports: Fails - should resolve
				expect(() => {
					lukeedResolve(packageJson, request, { conditions });
				}).toThrow('Missing "./file.js" export in "undefined" package');

				// resolve-pkg-maps: Passes - Leaves fallback up to user to handle
				expect(
					resolveExports(packageJson.exports, request, conditions),
				).toStrictEqual(['./file/file.js']);

				// Node.js: Expected behavior
				expect(
					await nodeResolveExports(
						packageJson.exports,
						request,
						conditions,
						{ '/file/file.js': '' },
					),
				).toBe('./file/file.js');
			},
		);

		// https://github.com/lukeed/resolve.exports/issues/7
		test(
			'should apply suffix to star / order of exports should not matter',
			async () => {
				const packageJson = {
					exports: {
						'./': './',
						'./*': './*.js',
					},
				};
				const request = 'file';
				const conditions = ['worker', 'node'];

				// lukeed/resolve.exports: Fails - should have .js appended
				expect(
					lukeedResolve(packageJson, request, { conditions }),
				).toBe('./file');

				// resolve-pkg-maps: Passes
				expect(
					resolveExports(packageJson.exports, request, conditions),
				).toStrictEqual(['./file.js']);

				// Node.js: Expected behavior
				expect(
					await nodeResolveExports(
						packageJson.exports,
						request,
						conditions,
						{ '/file.js': '' },
					),
				).toBe('./file.js');
			},
		);
	});
});
