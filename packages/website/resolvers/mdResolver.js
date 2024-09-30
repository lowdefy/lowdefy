import YAML from 'yaml';
import { serializer } from '@lowdefy/helpers';

// Resolver allows Lowdefy config to be inserted and used in Markdown (.md) files
// Config can be inserted in a codeblock with language tag `yaml ldf`
// i.e.,
//    ```yaml ldf
//    _ref: file_path.yaml
//    ```
// Allows for nested ldf code (resolves _refs to _refs)
//
// Syntax decision - Why yaml ldf:
//  - allows yaml syntax highlighting when editing ldf blocks 
//  - non-ldf yaml still renders as regular yaml codeblock

async function mdResolver(refPath, vars) {

  const { content } = vars; // Markdown file content

  // regex to find Lowdefy config
  // captures content in `yaml ldf` codeblock
  // ignores any whitespace characters after closing tag
  const regex = new RegExp('\`\`\`yaml (ldf\\n.*)\\n\`\`\`\\s*$', 'gm');

  let counter = 0; // used to increment id of md blocks

  // splits content around regex
  const parsedMarkdown = content.split(regex).map((text) => {
    // ignores empty strings to avoid unnecessary md blocks between ldf blocks
    if (text.trim() !== '') {


      // parses codeblock as yaml only if capture group starts with "ldf"
      if (text.substring(0, 3) == 'ldf') {
        return serializer.deserialize(YAML.parse(text.substring(3), {}));
      }
      // any other content is returned as a properly formatted ldf block
      return {
        id: `md_${++counter}`,
        type: 'MarkdownWithCode',
        properties: {
          content: text.trim(),
        },
      };
    }
  });

  // returns array of all markdown and parsed ldf blocks
  const allEntries = parsedMarkdown.filter((object) => !!object);

  return allEntries;

}

export default mdResolver;
