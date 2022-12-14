import { testSuite, expect } from 'manten';
import { resolveExportsWithNode } from '../utils/resolve-with-node.js';
import { resolveExports } from '#resolve-pkg-maps';

export default testSuite(({ describe }) => {
	describe('fallback array', ({ test }) => {
		test(
			'skips false condition',
			() => resolveExportsWithNode({
				exports: [
					{
						'condition-a': './a.js',
					},
					'./b.js',
					'std:core-module',
				],

				assertions: [
					{
						request: '',
						conditions: [],
						output: ['./b.js', 'std:core-module'],
					},
				],
			}),
		);

		test(
			'returns array of matched fallback paths',
			() => {
				const exports = [
					'./a.js',
					{
						'condition-b': './b.js',
					},
					'./c.js',
					{
						'condition-d': './d.js',
						default: ['./e.js', './f.js'],
					},
				] as const;
				const resolved = resolveExports(exports, '', []);

				expect(resolved).toStrictEqual([
					'./a.js',
					'./c.js',
					'./e.js',
					'./f.js',
				]);
			},
		);

		test(
			'stars replaced',
			() => {
				const exports = {
					'./*': [
						{ condition: './dir-a/*.js' },
						'./dir-b/*.js',
						{ default: './dir-c/*.js' },
						{
							default: {
								default: [
									'./dir-d/*',
									'./dir-e/*/*.js',
								],
							},
						},
					],
				} as const;
				const resolved = resolveExports(exports, 'file', []);

				expect(resolved).toStrictEqual([
					'./dir-b/file.js',
					'./dir-c/file.js',
					'./dir-d/file',
					'./dir-e/file/file.js',
				]);
			},
		);
	});
});
