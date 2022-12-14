import { testSuite } from 'manten';
import { resolveExportsWithNode } from '../utils/resolve-with-node.js';

export default testSuite(({ describe }) => {
	describe('basic', ({ test, describe }) => {
		describe('main entry point', ({ test }) => {
			test(
				'export string',
				() => resolveExportsWithNode({
					exports: './entry.js',

					assertions: [{
						request: '',
						conditions: [],
						output: ['./entry.js'],
					}],
				}),
			);

			test(
				'export map',
				() => resolveExportsWithNode({
					exports: { '.': './entry.js' },
					assertions: [
						{
							request: '',
							conditions: [],
							output: ['./entry.js'],
						},
						{
							request: '.',
							conditions: [],
							error: '[ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath \'./.\' is not defined by "exports"',
						},
					],
				}),
			);
		});

		test(
			'multiple entries',
			() => resolveExportsWithNode({
				exports: {
					'./a': './lib/a.js',
					'./.invisible': './.invisible.js',
				},

				assertions: [
					// Non relative path
					{
						request: 'a',
						conditions: [],
						output: ['./lib/a.js'],
					},

					{
						request: 'a',
						conditions: [],
						output: ['./lib/a.js'],
					},

					// Invisible file
					{
						request: '.invisible',
						conditions: [],
						output: ['./.invisible.js'],
					},
				],
			}),
		);
	});
});
