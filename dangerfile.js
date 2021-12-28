import { message, danger } from 'danger';
import { codeCoverage } from 'danger-plugin-code-coverage';

const modifiedMD = danger.git.modified_files.join('- ');
message('Changed Files in this PR: \n - ' + modifiedMD);

codeCoverage();
