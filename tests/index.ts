import { describe } from 'manten';

describe('resolve-pkg-maps', ({ runTestSuite }) => {
	runTestSuite(import('./exports/index.js'));
	runTestSuite(import('./imports/index.js'));
});
