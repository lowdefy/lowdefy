import YAML from 'yaml';
import { serializer } from '@lowdefy/helpers';

async function mdResolver(refPath, vars) {

  const { content } = vars;

  const regex = new RegExp('\`\`\`yaml (ldf\\n.*)\\n\`\`\`\\s*$', 'gm');

  let counter = 0;

  const parsedMarkdown = content.split(regex).map((text) => {
    if (text.trim() !== '') {

      if (text.substring(0, 3) == 'ldf') {
        return serializer.deserialize(YAML.parse(text.substring(3), {}));
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
