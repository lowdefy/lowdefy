import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DOCS_DIR = __dirname;
const OUTPUT_FILE = path.join(DOCS_DIR, 'lowdefy_docs.md');

// More targeted patterns for documentation files
const patterns = [
  'introduction.yaml',
  'concepts/*.yaml',
  'tutorial/*.yaml',
  'deployment/*.yaml',
  'plugins/*.yaml',
  'users/**/*.yaml',
  'blocks/**/*.yaml',
  'connections/*.yaml',
  'actions/*.yaml',
  'operators/*.yaml',
  'migration/*.yaml',
  'README.md',
];

function getCurrentBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    return branch;
  } catch (error) {
    console.warn('Could not determine git branch:', error.message);
    return 'unknown';
  }
}

function formatDate() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0] + ' UTC';
}

function formatDocYaml(vars) {
  let md = '';
  if (vars.pageTitle) {
    md += `# ${vars.pageTitle}\n\n`;
  }
  if (vars.section) {
    md += `**Section:** ${vars.section}\n\n`;
  }
  if (vars.description) {
    md += `## Description\n\n${vars.description.trim()}\n\n`;
  }
  if (vars.description_content) {
    md += `## Description\n\n${vars.description_content.trim()}\n\n`;
  }
  if (vars.types) {
    md += `## Types\n\n${vars.types.trim()}\n\n`;
  }
  if (vars.params) {
    md += `## Parameters\n\n${vars.params.trim()}\n\n`;
  }
  if (vars.arguments) {
    md += `## Arguments\n\n${vars.arguments.trim()}\n\n`;
  }
  if (vars.examples) {
    md += `## Examples\n\n${vars.examples.trim()}\n\n`;
  }
  if (vars.methods) {
    md += `## Methods\n\n`;
    vars.methods.forEach((method) => {
      md += `### ${method.name}\n\n`;
      if (method.description) md += `${method.description.trim()}\n\n`;
      if (method.types) md += `\`\`\`\n${method.types.trim()}\n\`\`\`\n\n`;
      if (method.arguments) md += `**Arguments:**\n${method.arguments.trim()}\n\n`;
      if (method.examples) md += `**Examples:**\n${method.examples.trim()}\n\n`;
    });
  }
  // Handle concept pages with `content` array
  if (vars.content && Array.isArray(vars.content)) {
    vars.content.forEach((block) => {
      if (block.properties && block.properties.content) {
        // Can't render nunjucks, so just show the template
        if (typeof block.properties.content === 'object' && block.properties.content._nunjucks) {
          md += `\n---\n**Nunjucks Template:**\n\`\`\`yaml\n${block.properties.content._nunjucks.template.trim()}\n\`\`\`\n---\n\n`;
        } else {
          md += `${block.properties.content}\n\n`;
        }
      }
    });
  }
  return md;
}

async function generateDocs() {
  // Get metadata
  const dateGenerated = formatDate();
  const branch = getCurrentBranch();

  // Start with metadata header
  let fullContent = `<!-- 
Date Generated: ${dateGenerated}
Branch: ${branch}
-->

# Lowdefy Documentation
`;

  for (const pattern of patterns) {
    const files = await glob(path.join(DOCS_DIR, pattern), { nodir: true });
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(DOCS_DIR, file);

      console.log(`Processing ${relativePath}...`);

      fullContent += `\n---\n\n## File: \`${relativePath}\`\n\n`;

      if (file.endsWith('.md')) {
        fullContent += content;
        continue;
      }

      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        try {
          const doc = yaml.load(content);
          // Pattern for action/block/operator docs
          if (doc._ref && doc._ref.vars) {
            fullContent += formatDocYaml(doc._ref.vars);
          }
          // Fallback for other YAML files
          else {
            fullContent += '```yaml\n' + content + '\n```';
          }
        } catch (e) {
          console.warn(
            `Could not parse YAML for ${relativePath}. Including raw content. Error: ${e.message}`
          );
          fullContent += '```yaml\n' + content + '\n```';
        }
        continue;
      }

      // Fallback for any other file type
      fullContent += '```\n' + content + '\n```';
    }
  }

  fs.writeFileSync(OUTPUT_FILE, fullContent);
  console.log(`\nSuccessfully generated documentation at ${OUTPUT_FILE}`);
  console.log(`Date: ${dateGenerated}`);
  console.log(`Branch: ${branch}`);
}

generateDocs();
