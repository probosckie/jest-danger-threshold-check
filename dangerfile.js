import { message, danger, warn, schedule } from 'danger';
import { codeCoverage } from 'danger-plugin-code-coverage';
import fs from 'fs';
import path from 'path';
import convert from 'xml-js';

//const modifiedMD = danger.git.modified_files.join('- ');
//message('Changed Files in this PR: \n - ' + modifiedMD);

const jestCoverageReport = '';
const coverReportFileName = './coverage/cobertura-coverage.xml';
let coverageJSON = '';
try {
  const data = fs.readFileSync(coverReportFileName, 'utf8');
  const formattedData = convert.xml2json(data, { compact: true, spaces: 2 });
  //console.log(formattedData);
  coverageJSON = JSON.parse(formattedData);
} catch (err) {
  console.error(err);
}

//codeCoverage();

//const createLink = (href, text) => `<a href='${href}'>${text}</a>`;

/* const toLinkList = (files: string[]): string => {
  const repoURL = danger.github.pr.head.repo.html_url;
  const ref = danger.github.pr.head.ref;
  return files
    .map((f) => createLink(`${repoURL}/blob/${ref}/${f}`, f))
    .map((a) => `- ${a}`)
    .join('\n');
}; */

//'!src/js/**/*.test.js',
//'!src/js/**/*.mock.js',
//'!src/js/**/*.stories.js',

const isAppFile = (file) => /^(?!.*\.d\.ts).*?\.(ts|js|tsx|jsx)$/.test(file);

const isATestFile = (file) => /^(.*)\.test\.(ts|js|tsx|jsx)$/.test(file);

const isOnlyFiles = (file) =>
  fs.existsSync(file) && fs.lstatSync(file).isFile();

const modifiedOrCreatedFiles = [
  ...danger.git.modified_files,
  ...danger.git.created_files,
]
  .filter((p) => p.includes('src/'))
  .filter((p) => isOnlyFiles(p) && isAppFile(p) && !isATestFile(p));

//call for modified files which are not tests, not for new files (for new files )
function checkMissingCoverageLines(fileName) {
  return danger.git.structuredDiffForFile(fileName).then((change) => {
    const additions = change.chunks[0].changes.filter((c) => c.type === 'add');
    const coverageForSelectedFile =
      coverageJSON.coverage.packages.package.classes.class.filter(
        (file) => file._attributes.filename === fileName,
      );
    if (coverageForSelectedFile && coverageForSelectedFile.length) {
      //if its a line which is hit - but it's a missed function - then the function takes priority (a function which has not been called
      const missedLines = coverageForSelectedFile[0].lines.line
        .filter((line) => line._attributes.hits === '0')
        .map((line) => {
          return line._attributes.number;
        })
        .reduce((acc, current) => {
          acc[current] = true;
          return acc;
        }, {});

      //methods.method could be a single object - if there is just 1 method in the file or an array

      const methodsAsArray = Array.isArray(
        coverageForSelectedFile[0].methods.method,
      )
        ? coverageForSelectedFile[0].methods.method
        : [coverageForSelectedFile[0].methods.method];

      const missedFunctions = methodsAsArray
        .filter((methodMeta) => methodMeta._attributes.hits === '0')
        .map((methodMeta) => {
          return methodMeta.lines.line._attributes.number;
        })
        .reduce((acc, current) => {
          acc[current] = true;
          return acc;
        }, {});

      const changedLinesNotCovered = additions.reduce((acc, line) => {
        if (line.ln.toString() in missedFunctions) {
          acc[line.ln] = 'function-miss';
        } else if (line.ln.toString() in missedLines) {
          acc[line.ln] = 'line-miss';
        }
        return acc;
      }, {});
      return changedLinesNotCovered;
    }
  });
}

/* checkMissingCoverageLines('src/multiply.js').then((value) =>
  console.log(value),
); */

let reportOfAllFilesMissingTests = '';

const generateMissingTestFilesSummary = async (modifiedFiles) => {
  let report = '';
  for (let i = 0; i < modifiedFiles.length; i++) {
    const r = await checkMissingCoverageLines(modifiedFiles[i]);
    report += modifiedFiles[i] + ' ' + JSON.stringify(r) + ' ';
  }
  console.log(report);
  //return report;
};

schedule(generateMissingTestFilesSummary(modifiedOrCreatedFiles));

//modifiedOrCreatedFiles.forEach()

/* message(
  'Modified or created files in this PR: \n - ' +
    modifiedOrCreatedFiles.join(', '),
); */
