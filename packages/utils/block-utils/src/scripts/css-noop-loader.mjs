export function resolve(specifier, context, next) {
  if (specifier.endsWith('.css') || specifier.endsWith('.less')) {
    return {
      url: 'data:text/javascript,export default {}',
      shortCircuit: true,
    };
  }
  return next(specifier, context);
}

export function load(url, context, next) {
  if (url === 'data:text/javascript,export default {}') {
    return {
      format: 'module',
      source: 'export default {}',
      shortCircuit: true,
    };
  }
  return next(url, context);
}
