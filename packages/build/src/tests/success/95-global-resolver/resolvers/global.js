export default function globalResolver(refPath, vars) {
  if (refPath === 'virtual/home.yaml') {
    return [
      'id: home',
      'type: Box',
      'blocks:',
      '  - id: homeTitle',
      '    type: Title',
      '    properties:',
      `      content: ${vars.title ?? 'Home'}`,
    ].join('\n');
  }
  if (refPath === 'virtual/about.yaml') {
    return ['id: about', 'type: Box', 'blocks:', '  - id: aboutTitle', '    type: Title'].join(
      '\n'
    );
  }
  return null;
}
