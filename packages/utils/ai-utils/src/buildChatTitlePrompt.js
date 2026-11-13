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

// The opening of the reply names the subject; the rest is elaboration the title can't carry,
// and tokens on a call made for every new conversation.
const MAX_REPLY_CHARS = 1200;

// The title is drawn from the first exchange, not the first message alone: a chat that offers
// suggested prompts opens many conversations with the same canned question, and only the
// reply says what each one is about.
function buildChatTitlePrompt({ firstUserText, replyText }) {
  return `Write a title for a chat conversation, given the user's opening message and the assistant's reply.

Rules:
- Name the subject, not the action. The opening message is often a canned prompt such as "Explain this" or "How do I get started?", and those words must not be the title. The subject is usually in the reply: the record, task, feature or question being discussed.
- 2 to 6 words, in sentence case. Keep established abbreviations as written.
- No quotation marks, no trailing punctuation, no "chat about" or "discussion of".
- If the exchange is about nothing specific, describe the ask in 2 or 3 plain words.
- Reply with only the title.

User's opening message:
${firstUserText}

Assistant's reply:
${replyText.slice(0, MAX_REPLY_CHARS)}`;
}

export { MAX_REPLY_CHARS };
export default buildChatTitlePrompt;
