import { danger, schedule, warn, fail, markdown } from 'danger';
const testCoverageUtil = require('./src/js/testCoverageCheck');


schedule(() => testCoverageUtil.checkTestCoverage({ danger, fail, markdown }));
