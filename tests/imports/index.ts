import { testSuite, expect } from 'manten';
import { nodeResolveImports } from '../utils/node-resolve.js';
import { resolveImports } from '#resolve-pkg-maps';

export default testSuite(({ describe }) => {
	describe('imports', ({ test, runTestSuite }) => {
		runTestSuite(import('./error-cases.js'));

		test(
			'resolves',
			async () => {
				const request = '#a';
				const imports = { [request]: './file.js' };
				const nodeResolved = await nodeResolveImports(imports, request, []);
				const resolved = resolveImports(imports, request, []);

				await expect(nodeResolved).toBe('./file.js');
				await expect(resolved[0]).toBe(nodeResolved);
			},
		);

		test(
			'resolves node_modules dependency (not allowed in exports)',
			async () => {
				const request = '#entry';
				const imports = { [request]: 'dependency' };
				const nodeResolved = await nodeResolveImports(imports, request, [], {
					'node_modules/dependency': {
						'package.json': '{}',
						'index.js': '',
					},
				});
				const resolved = resolveImports(imports, request, []);

				await expect(nodeResolved).toBe('./node_modules/dependency/index.js');
				await expect(resolved[0]).toBe('dependency');
			},
		);

		test(
			'conditions',
			async () => {
				const request = '#entry';
				const imports = {
					[request]: {
						'condition-a': './condition-a.js',
						'condition-b': './condition-b.js',
						default: './default.js',
					},
				};

				const conditions = [
					[[], './default.js'],
					[['condition-a'], './condition-a.js'],
					[['condition-a', 'condition-b'], './condition-a.js'],
				] as const;

				for (const [condition, expected] of conditions) {
					const nodeResolved = await nodeResolveImports(imports, request, condition);
					const resolved = resolveImports(imports, request, condition);

					await expect(nodeResolved).toBe(expected);
					await expect(resolved[0]).toBe(nodeResolved);
				}
			},
		);

		test(
			'star',
			async () => {
				const request = '#entry/file';
				const imports = {
					'#entry/*': {
						dev: './src/*.js',
						test: './tests/*/*.spec.js',
						default: './dist/*.js',
					},
				};

				const conditions = [
					[[], './dist/file.js'],
					[['dev'], './src/file.js'],
					[['test'], './tests/file/file.spec.js'],
				] as const;

				const files = {
					'src/file.js': '',
					'tests/file/file.spec.js': '',
					'dist/file.js': '',
				} as const;

				for (const [condition, expected] of conditions) {
					const nodeResolved = await nodeResolveImports(imports, request, condition, files);
					const resolved = resolveImports(imports, request, condition);

					await expect(nodeResolved).toBe(expected);
					await expect(resolved[0]).toBe(nodeResolved);
				}
			},
		);

		describe('star order', ({ test }) => {
			const imports = {
				'#entry/*': './*.js',
				'#entry/*.js': null,
			};
			const files = { 'file.js': '' };

			test('resolves', async () => {
				const request = '#entry/file';
				const nodeResolved = await nodeResolveImports(imports, request, [], files);
				const [resolved] = resolveImports(imports, request, []);

				await expect(nodeResolved).toBe('./file.js');
				await expect(resolved).toBe(nodeResolved);
			});

			test('blocks request', async () => {
				const request = '#entry/file.js';
				const error = '[ERR_PACKAGE_IMPORT_NOT_DEFINED]: Package import specifier "#entry/file.js" is not defined in package';

				expect(
					() => resolveImports(imports, request, []),
				).toThrow(error);

				await expect(
					nodeResolveImports(imports, request, [], files),
				).rejects.toThrow(error);
			});
		});
	});
});
