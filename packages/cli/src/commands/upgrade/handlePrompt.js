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

async function handlePrompt({ promptPath, guidePath, codemodId, logger }) {
  const aiTool = detectAiTool();
  const promptContent =
    promptPath && fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf8') : null;
  const guideContent =
    guidePath && fs.existsSync(guidePath) ? fs.readFileSync(guidePath, 'utf8') : null;

  const displayContent = promptContent ?? guideContent;
  if (!displayContent) {
    logger.warn(`No prompt or guide found for ${codemodId}. Skipping.`);
    return { status: 'skipped' };
  }

  const options = [];
  if (aiTool) {
    options.push({ key: 'copy', label: `Copy migration prompt to clipboard` });
    options.push({ key: 'guide', label: 'View manual migration guide' });
    options.push({ key: 'skip', label: 'Skip for now' });
    logger.info(`${aiTool} detected.`);
  } else {
    options.push({ key: 'copy', label: 'Copy migration prompt to clipboard' });
    options.push({ key: 'guide', label: 'View manual migration guide' });
    options.push({ key: 'skip', label: 'Skip for now' });
  }

  options.forEach((opt, i) => {
    logger.info(`  [${i + 1}] ${opt.label}`);
  });

  const answer = await askQuestion('  > ');
  const index = parseInt(answer, 10) - 1;
  const choice = options[index]?.key ?? 'skip';

  if (choice === 'copy') {
    const copied = copyToClipboard(promptContent ?? displayContent);
    if (copied) {
      logger.info(
        'Prompt copied to clipboard. Paste into your AI tool, then press Enter when done.'
      );
    } else {
      logger.info('Could not copy to clipboard. Prompt content:');
      logger.info(displayContent);
    }
    await askQuestion('Press Enter when done...');
    return { status: 'completed' };
  }

  if (choice === 'guide') {
    logger.info(guideContent ?? promptContent);
    await askQuestion('Press Enter when done...');
    return { status: 'completed' };
  }

  return { status: 'skipped' };
}

export { detectAiTool, askQuestion, copyToClipboard };
export default handlePrompt;
