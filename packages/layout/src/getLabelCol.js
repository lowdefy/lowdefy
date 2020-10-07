const getLabelCol = (value, inline) => {
  if (inline) {
    return { flex: '0 1 auto' };
  }
  const defaultVal = {
    xs: { span: 24 },
    sm: { span: 24 },
  };
  if (value.span) {
    defaultVal.md = { span: value.span };
  }
  if (value.sm) {
    defaultVal.sm = value.sm;
    defaultVal.xs = value.sm;
  }
  if (value.xs) {
    defaultVal.xs = value.xs;
  }
  if (value.md) {
    defaultVal.md = value.md;
  }
  if (value.lg) {
    defaultVal.lg = value.lg;
  }
  if (value.xl) {
    defaultVal.xl = value.xl;
  }
  if (value.xxl) {
    defaultVal.xxl = value.xxl;
  }
  return defaultVal;
};
export default getLabelCol;
