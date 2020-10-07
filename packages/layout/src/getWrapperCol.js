const getWrapperCol = (value, inline) => {
  if (inline) {
    return { flex: '1 1 auto' };
  }
  const defaultVal = {
    xs: { span: 24 },
    sm: { span: 24 },
  };
  if (value.span) {
    defaultVal.md = { span: 24 - value.span };
  }
  if (value.sm && value.sm.span) {
    defaultVal.sm = { span: 24 - value.sm.span };
    defaultVal.xs = { span: 24 - value.sm.span };
  }
  if (value.xs && value.xs.span) {
    defaultVal.xs = { span: 24 - value.xs.span };
  }
  if (value.md && value.md.span) {
    defaultVal.md = { span: 24 - value.md.span };
  }
  if (value.lg && value.lg.span) {
    defaultVal.lg = { span: 24 - value.lg.span };
  }
  if (value.xl && value.xl.span) {
    defaultVal.xl = { span: 24 - value.xl.span };
  }
  if (value.xxl && value.xxl.span) {
    defaultVal.xxl = { span: 24 - value.xxl.span };
  }
  return defaultVal;
};
export default getWrapperCol;
