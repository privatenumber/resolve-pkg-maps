import { testSuite, expect } from 'manten';
import { nodeResolveImports } from '../utils/node-resolve.js';
import { resolveImports } from '#resolve-pkg-maps';

export default testSuite(({ describe }) => {
	describe('error cases', ({ test }) => {
		test(
			'missing target',
			async () => {
				const request = '#entry';
				const dependencyName = 1;
				const imports = {};
				const files = {
					[`node_modules/${dependencyName}`]: {
						'package.json': '{}',
						'index.js': '',
					},
				};

				expect(
					() => resolveImports(imports, request, []),
				).toThrow(
					'Package import specifier "#entry" is not defined in package',
				);
				await expect(
					nodeResolveImports(imports, request, [], files),
				).rejects.toThrow(
					'[ERR_PACKAGE_IMPORT_NOT_DEFINED]: Package import specifier "#entry" is not defined',
				);
			},
		);

		test(
			'numeric value',
			async () => {
				const request = '#entry';
				const dependencyName = 1;
				const imports = { [request]: dependencyName };
				const files = {
					[`node_modules/${dependencyName}`]: {
						'package.json': '{}',
						'index.js': '',
					},
				};

				// @ts-expect-error number type
				expect(() => resolveImports(imports, request, [])).toThrow('Invalid "imports" target "1"');

				// @ts-expect-error number type
				await expect(nodeResolveImports(imports, request, [], files)).rejects.toThrow('Invalid "imports" target "1"');
			},
		);

		test(
			'boolean value',
			async () => {
				const request = '#entry';
				const dependencyName = true;
				const imports = { [request]: dependencyName };
				const files = {
					[`node_modules/${dependencyName}`]: {
						'package.json': '{}',
						'index.js': '',
					},
				};

				// @ts-expect-error number type
				expect(() => resolveImports(imports, request, [])).toThrow('Invalid "imports" target "true"');

				// @ts-expect-error number type
				await expect(nodeResolveImports(imports, request, [], files)).rejects.toThrow('Invalid "imports" target "true"');
			},
		);

		test(
			'starts with ..',
			async () => {
				const request = '#entry';
				const target = '../file.js';
				const imports = { [request]: target };

				expect(() => resolveImports(imports, request, [])).toThrow(`Invalid "imports" target "${target}"`);
				await expect(nodeResolveImports(imports, request, [])).rejects.toThrow(`Invalid "imports" target "${target}"`);
			},
		);

		test(
			'.. in path',
			async () => {
				const request = '#entry';
				const target = './directory/../file.js';
				const imports = { [request]: target };

				expect(() => resolveImports(imports, request, [])).toThrow(`Invalid "imports" target "${target}"`);
				await expect(nodeResolveImports(imports, request, [])).rejects.toThrow(`Invalid "imports" target "${target}"`);
			},
		);

		test(
			'node_modules in path',
			async () => {
				const request = '#entry';
				const dependencyName = 'dependency';
				const target = `./node_modules/${dependencyName}/file.js`;
				const imports = { [request]: target };
				const files = {
					[`node_modules/${dependencyName}`]: {
						'package.json': '{}',
						'file.js': '',
					},
				};

				expect(() => resolveImports(imports, request, [])).toThrow(`Invalid "imports" target "${target}"`);
				await expect(nodeResolveImports(imports, request, [], files)).rejects.toThrow(`Invalid "imports" target "${target}"`);
			},
		);
	});
});
