const convert = require('xml-js');
const { createMarkdownTable } = require('./commonUtils');
const configs = require('./configs');
const fs = require('fs');

function toFixedPercentage(coverage) {
  if (!coverage) return '0.00';
  return (Number(coverage) * 100).toFixed(2);
}

function getCoverageRestrictions(isNewFile) {
  return isNewFile
    ? configs.restriction.newFile
    : configs.restriction.existingFile;
}

function skipCoverageCheck(prLabels) {
  return (
    !!prLabels &&
    !!prLabels.find((label) => label.name === configs.skipTestPrLabel)
  );
}

function generateTestCoverageJSON(coverageFilePath) {
  let coverageJSON = '';
  try {
    const data = fs.readFileSync(coverageFilePath, 'utf8');
    const formattedData = convert.xml2json(data, { compact: true, spaces: 2 });
    coverageJSON = JSON.parse(formattedData);
  } catch (err) {
    console.error('Error in creating test coverage json');
  }
  return coverageJSON;
}

function getCoveragesOfSingleFileInFolder(coverageJSON) {
  return coverageJSON.coverage.packages.package.filter((file) => {
    return (
      file.classes.class._attributes && file.classes.class._attributes.filename
    );
  });
}

function getCoveragesOfMultipleFilesInFolder(coverageJSON) {
  return coverageJSON.coverage.packages.package.filter((file) => {
    return !(
      file.classes.class._attributes && file.classes.class._attributes.filename
    );
  });
}

const shouldTestFile = (file) => {
  if (!configs.fileMatchRegexes.every((reg) => reg.test(file))) {
    return false;
  }

  if (!configs.fileIgnoreRegexes.every((reg) => !reg.test(file))) {
    return false;
  }
  return true;
};

const isValidFile = (file) =>
  fs.existsSync(file) && fs.lstatSync(file).isFile();

function chooseFilesForCoverageCheck(files) {
  return files.filter((p) => isValidFile(p) && shouldTestFile(p));
}

function generateMapOfCreatedFilesInPr(files) {
  return files.reduce((acc, current) => {
    acc[current] = true;
    return acc;
  }, {});
}

function findFileInSingleFiles(singleFileInFolder, fileName) {
  return singleFileInFolder.find(
    (file) => fileName === file.classes.class._attributes.filename,
  );
}

function findFileInMultipleFiles(multipleFilesInFolder, fileName) {
  let targetFile = null;
  multipleFilesInFolder.find((files) => {
    targetFile = files.classes.class.find((file) => {
      return file._attributes.filename === fileName;
    });
    return targetFile;
  });
  return targetFile;
}

function getCoverageForFile(
  fileName,
  singleFileInFolder,
  multipleFilesInFolder,
) {
  const findTargetFileAmongSingleFile = findFileInSingleFiles(
    singleFileInFolder,
    fileName,
  );

  const findTargetFileAmongMultipleFiles = findFileInMultipleFiles(
    multipleFilesInFolder,
    fileName,
  );

  return findTargetFileAmongSingleFile
    ? findTargetFileAmongSingleFile.classes.class
    : findTargetFileAmongMultipleFiles;
}

const isHit = (param) => {
  return param !== '0';
};

function getLinesHitReport(lines) {
  const linesAsArray = Array.isArray(lines) ? lines : [lines];
  return linesAsArray
    .map((line) => ({
      number: line._attributes.number,
      hit: isHit(line._attributes.hits),
    }))
    .reduce((acc, current) => {
      acc[current.number] = current.hit;
      return acc;
    }, {});
}

function getCoverageReport(
  changedLinesInPr,
  fileName,
  singleFileInFolder,
  multipleFilesInFolder,
) {
  let additions = [];

  //if a file is simply renamed - it wont have any additions - hence filter is written inside of an if statement
  if (changedLinesInPr.chunks.length) {
    additions = changedLinesInPr.chunks[0].changes.filter(
      (c) => c.type === 'add',
    );
  }

  const report = {
    lines_which_changed: 0,
    lines_which_were_hit: 0,
    overall_coverage: 0,
  };

  let linesCoverage;
  const fileCoverage = getCoverageForFile(
    fileName,
    singleFileInFolder,
    multipleFilesInFolder,
  );

  if (fileCoverage.lines.line) {
    //if there are lines in this PR change - which are counted in coverage file
    linesCoverage = getLinesHitReport(fileCoverage.lines.line);
  }

  additions.forEach((line) => {
    const lineNumber = line.ln.toString();
    if (linesCoverage && lineNumber in linesCoverage) {
      //if this line is present in the coverage report - then its a line worth finding a hit or a miss
      report.lines_which_changed++;
      if (linesCoverage[lineNumber]) {
        //if this line is present in the coverage report - and its covered by the coverage - report it as a covered line
        report.lines_which_were_hit++;
      }
    }
  });

  if (report.lines_which_changed > 0) {
    report.percentage_lines_hit =
      report.lines_which_were_hit / report.lines_which_changed;
  }

  report.overall_coverage = Number(fileCoverage._attributes['line-rate']);

  return report;
}

function generateMarkdownReportTable(fileArray, isNew) {
  const restriction = getCoverageRestrictions(isNew);

  const newFilesTable = fileArray.map(
    ({
      file,
      isAboveLineThreshold,
      shouldCheckOverallThreshold,
      isAboveOverallThreshold,
      coverageReport: report,
    }) => {
      const overallReport = shouldCheckOverallThreshold
        ? `Expected=${toFixedPercentage(
            restriction.overall,
          )}% Actual=${toFixedPercentage(report.overall_coverage)}%`
        : ``;
      /* const methodReport = shouldCheckMethodThreshold
        ? `Expected=${toFixedPercentage(
            restriction.methodHit,
          )}% Actual=${toFixedPercentage(
            report.methods_which_were_hit / report.methods_which_changed,
          )}% `
        : ``; */

      const lineThresholdCell = `${
        isAboveLineThreshold ? '🟢' : '🔴'
      } Expected=${toFixedPercentage(
        restriction.lineHit,
      )}% Actual=${toFixedPercentage(
        report.lines_which_were_hit / report.lines_which_changed,
      )}%`;

      /* const methodThresholdCell = `${
        !shouldCheckMethodThreshold
          ? 'No Functions in this file'
          : isAboveMethodThreshold
          ? '🟢'
          : '🔴'
      } ${methodReport}`; */

      const overallThresholdCell = `${
        !shouldCheckOverallThreshold
          ? ''
          : isAboveOverallThreshold
          ? '🟢'
          : '🔴'
      } ${overallReport}`;

      return [file, lineThresholdCell, overallThresholdCell];
    },
  );

  newFilesTable.unshift(
    isNew
      ? configs.markdownReportNewFileHeaders
      : configs.markdownReportExistingFileHeaders,
  );

  return createMarkdownTable(newFilesTable);
}

function didLineCheckPassForFile(coverageReport, isNewFile) {
  if (coverageReport.lines_which_changed === 0) {
    return configs.NO_LINES_CHANGED_WHICH_ARE_COVERED;
  }

  const restrictions = getCoverageRestrictions(isNewFile);

  return coverageReport.percentage_lines_hit >= restrictions.lineHit;
}

/* function didMethodCheckPassForFile(coverageReport, isNewFile) {
  if (coverageReport.methods_which_changed === 0) {
    return true;
  }
  const restrictions = getCoverageRestrictions(isNewFile);

  return coverageReport.percentage_methods_hit >= restrictions.methodHit;
} */

function didOverallCheckPassForFile(coverageReport, isNewFile) {
  if (coverageReport.lines_which_changed === 0) {
    return true;
  }
  const restrictions = getCoverageRestrictions(isNewFile);

  return coverageReport.overall_coverage >= restrictions.overall;
}

module.exports = {
  skipCoverageCheck,
  generateTestCoverageJSON,
  getCoveragesOfSingleFileInFolder,
  getCoveragesOfMultipleFilesInFolder,
  chooseFilesForCoverageCheck,
  generateMapOfCreatedFilesInPr,
  getCoverageForFile,
  getCoverageReport,
  generateMarkdownReportTable,
  didLineCheckPassForFile,
  didOverallCheckPassForFile,
  shouldTestFile,
  findFileInSingleFiles,
  findFileInMultipleFiles,
};
