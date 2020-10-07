import nunjucks from 'nunjucks';
import dateFilter from 'nunjucks-date-filter';
import type from '@lowdefy/type';

// dateFilter.setDefaultFormat('YYYY-MM-DD');
export const nunjucksEnv = new nunjucks.Environment();

nunjucksEnv.addFilter('date', dateFilter);

const nunjucksTemplates = {};
// slow
export const nunjucksString = (templateString, value) => {
  if (type.isPrimitive(value)) {
    return nunjucksEnv.renderString(templateString, { value });
  }
  return nunjucksEnv.renderString(templateString, value);
};

export const validNunjucksString = (templateString, returnError = false) => {
  try {
    nunjucksString(templateString, {});
    return true;
  } catch (e) {
    if (returnError) {
      return { name: e.name, message: e.message };
    }
    return false;
  }
};

// fast
// test with memoization
// this method compiles a nunjucks string only if the client has not compiled the same string before.
export const nunjucksFunction = (templateString) => {
  // template was already compiled
  if (type.isFunction(nunjucksTemplates[templateString])) {
    return nunjucksTemplates[templateString];
  }
  if (type.isString(templateString)) {
    const template = nunjucks.compile(templateString, nunjucksEnv);
    // execute once to throw catch template errors
    template.render({});
    nunjucksTemplates[templateString] = (value) => {
      if (type.isPrimitive(value)) {
        return template.render({ value });
      }
      return template.render(value);
    };
  } else {
    // for non string types like booleans or objects
    nunjucksTemplates[templateString] = () => templateString;
  }
  return nunjucksTemplates[templateString];
};
