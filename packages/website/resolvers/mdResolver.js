import YAML from 'yaml';
import { serializer } from '@lowdefy/helpers';

async function mdResolver(refPath, vars) {

  const { content } = vars;

  // edit the string here...
  const regex = new RegExp('\`\`\`ldf\\n([\\s\\S]*?)\\n\`\`\`$', 'gm');
  let counter = 0;

  const parsedMarkdown = content.split(regex).map((text, index) => {
    if (text.trim() !== '') {
      if (index % 2 !== 0) {
        return serializer.deserialize(YAML.parse(text, {}));
      }
      return {
        id: `md_${++counter}`,
        type: 'MarkdownWithCode',
        properties: {
          content: text.trim(),
        },
      };
    }
  });

  const allEntries = parsedMarkdown.filter((object) => !!object);
  return allEntries;

}

export default mdResolver;
