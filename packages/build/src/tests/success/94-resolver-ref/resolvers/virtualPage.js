export default function virtualPage(path, vars) {
  return [
    'id: dashboard',
    'type: Box',
    'blocks:',
    '  - id: dashboardTitle',
    '    type: Title',
    '    properties:',
    `      content: ${vars.title}`,
  ].join('\n');
}
