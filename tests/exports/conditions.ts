import { testSuite, expect } from 'manten';
import { nodeResolveExports } from '../utils/node-resolve.js';
import { resolveExportsWithNode } from '../utils/resolve-with-node.js';
import { resolveExports } from '#resolve-pkg-maps';

export default testSuite(({ describe }) => {
	describe('conditions', ({ test }) => {
		describe(
			'single entry - only conditions',
			({ test }) => {
				const exports = {
					'condition-a': './lib/a.js',
					'condition-b': './lib/b.js',
				};

				const request = '';

				test('no match', async () => {
					const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined';

					expect(
						() => resolveExports(exports, request, []),
					).toThrow(error);

					await expect(
						nodeResolveExports(exports, request, []),
					).rejects.toThrow(error);
				});

				test('match', async () => {
					const validCondition = ['condition-b'];

					expect(
						resolveExports(exports, request, validCondition),
					).toStrictEqual(['./lib/b.js']);

					expect(
						await nodeResolveExports(exports, request, validCondition),
					).toBe('./lib/b.js');
				});

				test('no match on non-existent condition', async () => {
					const invalidCondition = ['nonexistent-condition'];
					const error = '[ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined';

					expect(
						() => resolveExports(exports, request, invalidCondition),
					).toThrow(error);

					await expect(
						nodeResolveExports(exports, request, invalidCondition),
					).rejects.toThrow(error);
				});
			},
		);

		test(
			'single-entry - with path',
			() => resolveExportsWithNode({
				exports: {
					'.': {
						'condition-a': './lib/a.js',
						'condition-b': './lib/b.js',
					},
				},

				assertions: [{
					request: '',
					conditions: ['condition-b'],
					output: ['./lib/b.js'],
				}],
			}),
		);

		test(
			'use default when no conditions',
			() => resolveExportsWithNode({
				exports: {
					'.': {
						'condition-a': './lib/a.js',
						default: './lib/index.js',
					},
				},

				assertions: [
					{
						request: '',
						conditions: [],
						output: ['./lib/index.js'],
					},
					{
						request: '',
						conditions: ['non-existent-condition'],
						output: ['./lib/index.js'],
					},
				],
			}),
		);

		test(
			'nested conditions',
			() => resolveExportsWithNode({
				exports: {
					node: {
						import: './node.import.js',
						require: './node.require.js',
					},
					browser: {
						import: './browser.import.js',
						require: './browser.require.js',
					},
				},

				assertions: [
					{
						request: '',
						conditions: ['require', 'node'],
						output: ['./node.require.js'],
					},
					{
						request: '',
						conditions: ['node', 'import'],
						output: ['./node.import.js'],
					},
					{
						request: '',
						conditions: ['import', 'browser'],
						output: ['./browser.import.js'],
					},
					{
						request: '',
						conditions: ['require', 'browser'],
						output: ['./browser.require.js'],
					},
					{
						request: '',
						conditions: ['node', 'require', 'random-condition-doesnt-matter'],
						output: ['./node.require.js'],
					},

					// Errors
					{
						request: '',
						conditions: [],
						error: 'No "exports" main defined',
					},
					{
						request: '',
						conditions: ['node'], // incomplete conditions
						error: 'No "exports" main defined',
					},
				],
			}),
		);
	});
});
