import { testSuite } from 'manten';

export default testSuite(({ describe }) => {
	describe('exports', ({ runTestSuite }) => {
		runTestSuite(import('./error-cases.js'));
		runTestSuite(import('./basic.js'));
		runTestSuite(import('./star.js'));
		runTestSuite(import('./conditions.js'));
		runTestSuite(import('./fallback-array.js'));
		runTestSuite(import('./compare-resolve.exports.js'));
	});
});
