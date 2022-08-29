const configs = require('./configs');
const coverageHelpers = require('./utils');
const fs = require('fs');

function getMissedCoverageReport(
  fileName,
  singleFileInFolder,
  multipleFilesInFolder,
  dangerArgs,
) {
  return dangerArgs.danger.git
    .structuredDiffForFile(fileName)
    .then((change) => {
      const coverageReport = coverageHelpers.getCoverageReport(
        change,
        fileName,
        singleFileInFolder,
        multipleFilesInFolder,
      );
      return coverageReport;
    });
}

const withIsNewFile = (fileReports, newFilesInPR) =>
  fileReports.map((fileReport) => ({
    ...fileReport,
    isNewFile: fileReport.file in newFilesInPR,
  }));

const withIsAboveLineThrehold = (fileReports) =>
  fileReports.map((fileReport) => ({
    ...fileReport,
    isAboveLineThreshold: coverageHelpers.didLineCheckPassForFile(
      fileReport.coverageReport,
      fileReport.isNewFile,
    ),
  }));

const withIsAboveCoverageThreshold = (fileReports) =>
  fileReports.map((fileReport) => {
    const shouldCheckOverallThreshold = !!(
      configs.restriction.newFile.overall ||
      configs.restriction.existingFile.overall
    );
    const isAboveOverallThreshold = coverageHelpers.didOverallCheckPassForFile(
      fileReport.coverageReport,
      fileReport.isNewFile,
    );
    return {
      ...fileReport,
      shouldCheckOverallThreshold,
      isAboveOverallThreshold,
    };
  });

const hasFileFailedThreshold = (fileReport) => {
  if (
    fileReport.isAboveLineThreshold ===
    configs.NO_LINES_CHANGED_WHICH_ARE_COVERED
  ) {
    return false;
  } else
    return (
      !fileReport.isAboveLineThreshold ||
      !(
        fileReport.shouldCheckOverallThreshold &&
        fileReport.isAboveOverallThreshold
      )
    );
};

const checkIsPRCheckPassed = (fileReports) => {
  return !fileReports.find(hasFileFailedThreshold);
};

const generateReports = (fileReports, dangerArgs) => {
  const newFilesInPR = fileReports
    .filter((fileReport) => fileReport.isNewFile)
    .filter((fileReport) => hasFileFailedThreshold(fileReport));

  const existingFilesInPR = fileReports
    .filter((fileReport) => !fileReport.isNewFile)
    .filter((fileReport) => hasFileFailedThreshold(fileReport));

  if (newFilesInPR.length > 0) {
    dangerArgs.markdown(
      coverageHelpers.generateMarkdownReportTable(newFilesInPR, true),
    );
  }
  if (existingFilesInPR.length > 0) {
    dangerArgs.markdown(
      coverageHelpers.generateMarkdownReportTable(existingFilesInPR, false),
    );
  }
};

const generateMissingTestFilesSummary = async (
  filesForCoverageCheck,
  newFilesInPR,
  singleFileInFolder,
  multipleFilesInFolder,
  dangerArgs,
  skipTestCoverageCheck,
) => {
  let fileReports = await Promise.all(
    filesForCoverageCheck.map(async (file) => ({
      file,
      coverageReport: await getMissedCoverageReport(
        file,
        singleFileInFolder,
        multipleFilesInFolder,
        dangerArgs,
      ),
    })),
  );

  fileReports = withIsNewFile(fileReports, newFilesInPR);
  fileReports = withIsAboveLineThrehold(fileReports);
  fileReports = withIsAboveCoverageThreshold(fileReports);

  const isPRCheckPassed = checkIsPRCheckPassed(fileReports);

  if (!isPRCheckPassed) {
    generateReports(fileReports, dangerArgs);
    if (!skipTestCoverageCheck) {
      dangerArgs.fail('PR check failed because of lack of tests');
    }
  }
};

const isCoverageFilePresent = () => {
  return fs.existsSync(configs.coverageFilePath);
};

const checkTestCoverage = (dangerArgs) => {
  const skipTestCoverageCheck = coverageHelpers.skipCoverageCheck(
    dangerArgs.danger.github &&
      dangerArgs.danger.github.issue &&
      dangerArgs.danger.github.issue.labels,
  );

  const coverReportFileName = configs.coverageFilePath;

  const coverageJSON =
    coverageHelpers.generateTestCoverageJSON(coverReportFileName);

  if (!coverageJSON) {
    dangerArgs.fail(
      'This check relies on the cobertura xml format of code coverage produced by jest - please provide correct path for it',
    );
  }
  const singleFileInFolder =
    coverageHelpers.getCoveragesOfSingleFileInFolder(coverageJSON);

  const multipleFilesInFolder =
    coverageHelpers.getCoveragesOfMultipleFilesInFolder(coverageJSON);

  const filesForCoverageCheck = coverageHelpers.chooseFilesForCoverageCheck([
    ...dangerArgs.danger.git.modified_files,
    ...dangerArgs.danger.git.created_files,
  ]);

  const newFiles = coverageHelpers.generateMapOfCreatedFilesInPr([
    ...dangerArgs.danger.git.created_files,
  ]);

  generateMissingTestFilesSummary(
    filesForCoverageCheck,
    newFiles,
    singleFileInFolder,
    multipleFilesInFolder,
    dangerArgs,
    skipTestCoverageCheck,
  );
};

module.exports = { checkTestCoverage, isCoverageFilePresent };
