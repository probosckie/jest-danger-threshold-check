const fileIgnoreRegexes = [
  /^(.*)\.(test|mock|stories)\.(ts|js|tsx|jsx|mdx)$/,
  /dangerfile.js/,
  /(.*)__tests__(.*)/,
  /(constants|types|ga)\.(ts|js|tsx)$/,
  /(.*)__mocks__(.*)/,
  /bootstrap.ts/,
];

const fileMatchRegexes = [/^src\/js\/(.*).(ts|js|tsx|jsx)$/];

const skipTestPrLabel = 'skip-test';

const markdownReportNewFileHeaders = [
  'FileName (new file)',
  'Changed code - Testing Threshold check',
  'Overall Threshold Check',
];

const markdownReportExistingFileHeaders = [
  'FileName (existing file)',
  'Changed code - Testing Threshold check',
  'Overall Threshold Check',
];

const restriction = {
  newFile: {
    lineHit: 0.5,
    overall: 0.5,
  },
  existingFile: {
    lineHit: 0.8,
    overall: 0.3,
  },
};

const NO_LINES_CHANGED_WHICH_ARE_COVERED = 'NO_LINES_CHANGED_WHICH_ARE_COVERED';

const coverageFilePath = './coverage/cobertura-coverage.xml';

module.exports = {
  fileIgnoreRegexes,
  fileMatchRegexes,
  skipTestPrLabel,
  restriction,
  markdownReportExistingFileHeaders,
  markdownReportNewFileHeaders,
  NO_LINES_CHANGED_WHICH_ARE_COVERED,
  coverageFilePath,
};
