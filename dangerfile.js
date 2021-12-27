import { message, danger } from 'danger';
import jest from 'danger-plugin-jest';

const modifiedMD = danger.git.modified_files.join('- ');
message('Changed Files in this PR: \n - ' + modifiedMD);

jest();
