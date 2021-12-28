import { message, danger, warn } from 'danger';
import { codeCoverage } from 'danger-plugin-code-coverage';
import fs from 'fs';
import path from 'path';

//const modifiedMD = danger.git.modified_files.join('- ');
//message('Changed Files in this PR: \n - ' + modifiedMD);

codeCoverage();

const createLink = (href, text) => `<a href='${href}'>${text}</a>`;

/* const toLinkList = (files: string[]): string => {
  const repoURL = danger.github.pr.head.repo.html_url;
  const ref = danger.github.pr.head.ref;
  return files
    .map((f) => createLink(`${repoURL}/blob/${ref}/${f}`, f))
    .map((a) => `- ${a}`)
    .join('\n');
}; */

const isAppFile = (file) => /^(?!.*\.d\.ts).*?\.(ts|js|tsx|jsx)$/.test(file);

const isOnlyFiles = (file) =>
  fs.existsSync(file) && fs.lstatSync(file).isFile();

const modifiedOrCreatedFiles = [
  ...danger.git.modified_files,
  ...danger.git.created_files,
]
  .filter((p) => p.includes('src/'))
  .filter((p) => isOnlyFiles(p) && isAppFile(p));

//const sumFile = modifiedOrCreatedFiles[1];
//message('the 1st file which is changed is ' + modifiedOrCreatedFiles);

/* danger.git.structuredDiffForFile('src/sum.js').then((change) => {
  message('found changed lines in this file');
  console.log(JSON.stringify(change));
}); */

message(
  'Modified or created files in this PR: \n - ' +
    modifiedOrCreatedFiles.join(', '),
);

/* const untestedFiles = modifiedOrCreatedFiles
  .filter((m) => !/(test|spec|snap)/.test(m))
  .map((file) => ({
    file,
    testFile: `${path.basename(file, path.extname(file))}.test${path.extname(
      file,
    )}`,
  }))
  .filter((m) => !modifiedOrCreatedFiles.find((f) => f.includes(m.testFile)));

const hasAppChanges = modifiedOrCreatedFiles.length;
const hasUntestedFiles = untestedFiles.length;
if (hasAppChanges && hasUntestedFiles) {
  const list = toLinkList(untestedFiles.map((u) => u.file));
  warn('App files should get test files' + `\n\n${list}`);
} */
