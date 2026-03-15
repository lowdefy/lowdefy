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

function stripMarkdown(text) {
  if (!text) return '';
  let result = text;
  // Remove fenced code blocks (```...```)
  result = result.replace(/```[\s\S]*?```/g, '');
  // Remove inline code backticks but keep content
  result = result.replace(/`([^`]*)`/g, '$1');
  // Remove HTML tags
  result = result.replace(/<[^>]+>/g, '');
  // Remove markdown images
  result = result.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  // Remove markdown links, keep text
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // Remove heading markers
  result = result.replace(/^#{1,6}\s+/gm, '');
  // Remove bold/italic markers
  result = result.replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2');
  // Normalize whitespace
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

export default stripMarkdown;
