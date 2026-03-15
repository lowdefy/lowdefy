/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import fs from 'fs';
import { execSync } from 'child_process';
import readline from 'readline';

function detectAiTool() {
  if (process.env.CLAUDE_CODE === '1' || fs.existsSync(`${process.env.HOME}/.claude`)) {
    return 'Claude Code';
  }
  return null;
}

function askQuestion(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function copyToClipboard(text) {
  try {
    if (process.platform === 'darwin') {
      execSync('pbcopy', { input: text });
    } else if (process.platform === 'linux') {
      execSync('xclip -selection clipboard', { input: text });
    } else if (process.platform === 'win32') {
      execSync('clip', { input: text });
    }
    return true;
  } catch {
    return false;
  }
}

async function handlePrompt({ path: filePath, codemodId, logger }) {
  const aiTool = detectAiTool();

  if (!filePath || !fs.existsSync(filePath)) {
    logger.warn(`No prompt/guide found for ${codemodId}. Skipping.`);
    return { status: 'skipped' };
  }

  const content = fs.readFileSync(filePath, 'utf8');

  if (aiTool) {
    logger.info(`    ${aiTool} detected.`);
  }

  logger.info('    [1] Copy migration prompt to clipboard');
  logger.info('    [2] View migration guide');
  logger.info('    [3] Skip for now');

  const answer = await askQuestion('    > ');
  const choice = parseInt(answer, 10);

  if (choice === 1) {
    const copied = copyToClipboard(content);
    if (copied) {
      logger.info(
        '    Prompt copied to clipboard. Paste into your AI tool, then press Enter when done.'
      );
    } else {
      logger.info('    Could not copy to clipboard. Content:');
      logger.info(content);
    }
    await askQuestion('    Press Enter when done...');
    return { status: 'completed' };
  }

  if (choice === 2) {
    logger.info(content);
    await askQuestion('    Press Enter when done...');
    return { status: 'completed' };
  }

  return { status: 'skipped' };
}

export { detectAiTool, askQuestion, copyToClipboard };
export default handlePrompt;
