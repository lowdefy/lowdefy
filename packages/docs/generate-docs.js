import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const DOCS_DIR = __dirname;
const OUTPUT_FILE = path.join(DOCS_DIR, 'lowdefy_docs.md');
const LOWDEFY_ROOT = path.resolve(__dirname, '../..');
const YAML_OPTIONS = { indent: 2, lineWidth: -1 };

// Documentation file patterns
const DOC_PATTERNS = [
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
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Could not determine git branch:', error.message);
    return 'unknown';
  }
}

function formatDate() {
  return new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';
}

function addSection(md, title, content) {
  if (!content) return md;
  return md + `## ${title}\n\n${content.trim()}\n\n`;
}

function formatCodeBlock(content, format = '') {
  const dumped =
    typeof content === 'object' ? yaml.dump(content, YAML_OPTIONS).trim() : content.trim();

  // Check if content already starts and ends with backticks (code block)
  // Handle both single line and multiline cases
  const lines = dumped.split('\n');
  const firstLine = lines[0].trim();
  const lastLine = lines[lines.length - 1].trim();

  if (firstLine.startsWith('```') && lastLine === '```') {
    return dumped; // Return as-is if already a code block
  }

  return `\`\`\`${format}\n${dumped}\n\`\`\``;
}

function formatContent(content, isYaml = false) {
  if (typeof content === 'string') {
    return content.trim();
  }
  const format = isYaml ? 'yaml' : 'json';
  const dumped = isYaml ? yaml.dump(content, YAML_OPTIONS) : JSON.stringify(content, null, 2);
  return formatCodeBlock(dumped, format);
}

function resolveSchemaPath(schemaRef) {
  const pluginPath = schemaRef.replace(/^\.\.\/plugins\//, '');
  return path.resolve(LOWDEFY_ROOT, 'packages/plugins', pluginPath);
}

function processSchema(schemaRef) {
  try {
    const schemaPath = resolveSchemaPath(schemaRef);

    if (!fs.existsSync(schemaPath)) {
      return `Schema file not found: \`${schemaRef}\``;
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schemaJson = JSON.parse(schemaContent);
    return formatContent(schemaJson);
  } catch (error) {
    return `Error reading schema: ${error.message}`;
  }
}

function formatMethods(methods) {
  return methods
    .map((method) => {
      let methodMd = `### ${method.name}\n\n`;
      if (method.description) methodMd += `${method.description.trim()}\n\n`;
      if (method.types) methodMd += `${formatCodeBlock(method.types)}\n\n`;
      if (method.arguments) methodMd += `**Arguments:**\n${method.arguments.trim()}\n\n`;
      if (method.examples) methodMd += `**Examples:**\n${method.examples.trim()}\n\n`;
      return methodMd;
    })
    .join('');
}

function processContentBlocks(contentBlocks) {
  return contentBlocks
    .map((block) => {
      if (!block.properties?.content) return '';

      // Handle nunjucks templates - extract just the template content
      if (typeof block.properties.content === 'object' && block.properties.content._nunjucks) {
        return `${block.properties.content._nunjucks.template.trim()}\n\n`;
      }

      return `${block.properties.content}\n\n`;
    })
    .join('');
}

function formatDocYaml(vars) {
  let md = '';

  // Basic metadata
  if (vars.pageTitle) md += `# ${vars.pageTitle}\n\n`;
  if (vars.section) md += `**Section:** ${vars.section}\n\n`;

  // Description sections
  md = addSection(md, 'Description', vars.description);
  if (vars.description_content) {
    md += `## Description\n\n${formatContent(
      vars.description_content,
      typeof vars.description_content !== 'string'
    )}\n\n`;
  }

  // Documentation sections
  md = addSection(md, 'Types', vars.types);
  md = addSection(md, 'Parameters', vars.params);
  md = addSection(md, 'Arguments', vars.arguments);

  // Schema section
  if (vars.schema) {
    md += `## Schema\n\n${processSchema(vars.schema)}\n\n`;
  }

  // Examples section
  if (vars.examples) {
    md += `## Examples\n\n${formatContent(vars.examples, typeof vars.examples !== 'string')}\n\n`;
  }

  // Methods section
  if (vars.methods) {
    md += `## Methods\n\n${formatMethods(vars.methods)}`;
  }

  // Content blocks (for concept pages)
  if (vars.content && Array.isArray(vars.content)) {
    md += processContentBlocks(vars.content);
  }

  return md;
}

function processFile(file, content, relativePath) {
  console.log(`Processing ${relativePath}...`);

  if (file.endsWith('.md')) {
    return content;
  }

  if (file.endsWith('.yaml') || file.endsWith('.yml')) {
    try {
      const doc = yaml.load(content);

      // Handle structured documentation with _ref.vars
      if (doc._ref?.vars) {
        return formatDocYaml(doc._ref.vars, file);
      }

      // Fallback for other YAML files
      return `\`\`\`yaml\n${content}\n\`\`\``;
    } catch (error) {
      console.warn(
        `Could not parse YAML for ${relativePath}. Including raw content. Error: ${error.message}`
      );
      return `\`\`\`yaml\n${content}\n\`\`\``;
    }
  }

  // Fallback for other file types
  return formatCodeBlock(content);
}

async function generateDocs() {
  const dateGenerated = formatDate();
  const branch = getCurrentBranch();

  let fullContent = `<!--
Date Generated: ${dateGenerated}
Branch: ${branch}
-->

# Lowdefy Documentation
`;

  for (const pattern of DOC_PATTERNS) {
    const files = await glob(path.join(DOCS_DIR, pattern), { nodir: true });

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(DOCS_DIR, file);

      fullContent += `\n---\n\n## File: \`${relativePath}\`\n\n`;
      fullContent += processFile(file, content, relativePath);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, fullContent);
  console.log(`\nSuccessfully generated documentation at ${OUTPUT_FILE}`);
  console.log(`Date: ${dateGenerated}`);
  console.log(`Branch: ${branch}`);
}

generateDocs();
