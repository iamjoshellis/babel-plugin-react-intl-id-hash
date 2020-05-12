const t = require('babel-types');
const crypto = require('crypto');

const isImportLocalName = (name, allowedNames, { file }) => {
  const isSearchedImportSpecifier = (specifier) =>
    specifier.isImportSpecifier() &&
    allowedNames.includes(specifier.node.imported.name) &&
    specifier.node.local.name === name;
  let isImported = false;
  file.path.traverse({
    ImportDeclaration: {
      exit(path) {
        isImported =
          path.node.source.value === 'react-intl' &&
          path.get('specifiers').some(isSearchedImportSpecifier);

        if (isImported) {
          path.stop();
        }
      },
    },
  });
  return isImported;
};

const isIdProp = (prop) => {
  const path = prop.get('key');
  return (path.isStringLiteral() ? path.node.value : path.node.name) === 'id';
};

const isDefaultMessgeProp = (prop) => {
  const path = prop.get('key');
  return (path.isStringLiteral() ? path.node.value : path.node.name) === 'defaultMessage';
};

const getMessage = (objectProperty) => {
  if (!objectProperty.isObjectExpression()) {
    return;
  }
  const objProps = objectProperty.get('properties');
  for (let i = 0, len = objProps.length; i < len; i++) {
    objectProperty = objProps[i];
    if (isDefaultMessgeProp(objectProperty)) {
      const propValue = objectProperty.get('value');
      if (propValue.isStringLiteral()) {
        return propValue.node.value;
      }
      break;
    }
  }
};

const isReactIntlImport = (path, state) => {
  const callee = path.get('callee');
  if (!callee.isIdentifier()) {
    return false;
  }
  if (!isImportLocalName(callee.node.name, ['defineMessages'], state)) {
    return false;
  }
  const messagesObj = path.get('arguments')[0];
  if (!messagesObj) {
    return false;
  }
  if (!(messagesObj.isObjectExpression() || messagesObj.isIdentifier())) {
    return false;
  }
  return true;
};

const replaceProperties = (properties) => {
  for (const prop of properties) {
    const objProp = prop.get('value');
    if (objProp.isObjectExpression()) {
      const message = getMessage(objProp);
      if (typeof message === 'undefined') {
        continue;
      }
      const hash = crypto.createHash('md5').update(message).digest('hex').substr(0, 8);
      objProp.replaceWith(
        t.objectExpression([
          t.objectProperty(t.stringLiteral('id'), t.stringLiteral(hash)),
          ...objProp
            .get('properties')
            .filter((v) => !isIdProp(v))
            .map((v) => v.node),
        ]),
      );
    }
  }
};

module.exports = function () {
  return {
    name: 'react-intl-message-hash',
    visitor: {
      CallExpression(path, state) {
        if (!isReactIntlImport(path, state)) {
          return;
        }
        const messagesObj = path.get('arguments')[0];
        let properties;
        if (messagesObj.isObjectExpression()) {
          properties = messagesObj.get('properties');
        } else if (messagesObj.isIdentifier()) {
          const name = messagesObj.node.name;
          const obj = messagesObj.scope.getBinding(name);
          if (!obj) {
            return;
          }
          properties = obj.path.get('init').get('properties');
        }
        if (properties) {
          replaceProperties(properties, state);
        }
      },
    },
  };
};
