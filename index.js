// plugin.js
const modelHmrStr = `
(function() {
  if (module.hot) {
    module.hot.accept(['./model','./model.js'], () => {
      const mymodal = require('./model').default;
      KOS.removeModel(mymodal.namespace);
      KOS.registeModel(mymodal);
      console.log('model['+mymodal.namespace+']更新成功');
    });
  }
})()`;

const hmrStr = `
(function() {
  if (module.hot) {
    module.hot.accept();
  }
})()
`;

module.exports = function({ types: t }) {
  let file = '';
  const map = {};
  let flag = true;
  return {
    visitor: {
      Program: {
        enter(path) {
          const { filename } = path.hub.file.opts;
          file = filename;
        }
      },
      ImportDeclaration(path) {
        const name = (path.node.specifiers[0] || { local: {} }).local.name;
        const value = path.node.source.value;
        if (flag && name === 'KOS' && /main\.js$/g.test(file)) {
          path.insertAfter(
            t.importDeclaration([t.importDefaultSpecifier(t.identifier('KOS'))], t.stringLiteral('kos-core'))
          );
          // console.log('main.js插入成功');
          path.replaceWithSourceString(hmrStr);
          flag = false;
          return;
        }
        if (name === 'model' && value === './model') {
          // 引入了model，头部引入Kos，底部插入modehmrstr
          if (!map[file]) {
            // console.log(`${file}插入成功`);
            path.insertAfter(
              t.importDeclaration([t.importDefaultSpecifier(t.identifier('KOS'))], t.stringLiteral('kos-core'))
            );
            path.insertAfter(
              t.importDeclaration([t.importDefaultSpecifier(t.identifier('model'))], t.stringLiteral('./model'))
            );
            path.replaceWithSourceString(modelHmrStr);
            map[file] = true;
          } else {
            map[file] = false;
          }
        }
      }
    }
  };
};
