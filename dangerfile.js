import { danger, schedule, warn, fail, markdown } from 'danger';
const testCoverageUtil = require('./src/testCoverageCheck');


schedule(() => testCoverageUtil.checkTestCoverage({ danger, fail, markdown }));
