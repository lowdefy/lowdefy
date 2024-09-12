import YAML from 'yaml';
import { serializer } from '@lowdefy/helpers';

// @Gerrie

// export const mdTransformer = (markdownText) => {
//   const regex = new RegExp('```ldf\\n([\\s\\S]*?)\\n```$', 'gm');
//   let counter = 0;
//
//   const parsedMarkdown = markdownText.split(regex).map((text, index) => {
//     if (text.trim() !== '') {
//       if (index % 2 !== 0) {
//         const splitText = text.split(':').map((text) => text.trim());
//         return Object.fromEntries([splitText]);
//       }
//       return {
//         id: `md_${++counter}`,
//         type: 'MarkdownWithCode',
//         properties: {
//           content: text.trim()
//         }
//       };
//     }
//   });

// return parsedMarkdown.filter((object) => !!object);

// }

//____________________Original Function_______________________________//

const mdTransformer = (markdownText) => {
  const regex = new RegExp('```ldf\\n([\\s\\S]*?)\\n```$', 'gm');
  let counter = 0;

  const parsedMarkdown = markdownText.split(regex).map((text, index) => {
    if (text.trim() !== '') {
      if (index % 2 !== 0) {
        const splitText = text.split(':').map((text) => text.trim());
        // return JSON.parse(text);
        return serializer.deserialize(YAML.parse(text, {}));

      }
      return {
        id: `md_${++counter}`,
        type: 'MarkdownWithCode',
        properties: {
          content: text.trim()
        }
      };
    }
  });

  const allEntries = parsedMarkdown.filter((object) => !!object);
  // console.log(allEntries);
  return allEntries;

  // page.areas.content.properties.content = content;
  // return page;
}

export default mdTransformer;
