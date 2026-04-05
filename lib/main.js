const path = require("path");
const fs = require("fs");
const { AutoLanguageClient } = require("@savetheclocktower/atom-languageclient");

const ROOT = path.normalize(path.join(__dirname, '..'));

class VueLanguageClient extends AutoLanguageClient {
  getLanguageName() {
    return "Vue";
  }
  getServerName() {
    return "Volar";
  }
  getPackageName() {
    return "pulsar-ide-vue";
  }
  getGrammarScopes() {
    return ["text.html.vue"];
  }
  getLanguageIdFromEditor(editor) {
    if (this.getGrammarScopes().includes(editor.getGrammar().scopeName))
      return 'vue';
    return super.getLanguageIdFromEditor(editor);
  }

  getPathToNode() {
    return atom.config.get(`${this.getPackageName()}.nodeBin`) ?? 'node';
  }

  findTypescriptPath() {
    // Use config value if present
    const tssdkConfig = atom.config.get(`${this.getPackageName()}.tsdk`);
    if (tssdkConfig != '') return tssdkConfig;
    // Search the open project folders
    for (let project of atom.project.getPaths()) {
      let ls = fs.readdirSync(project);
      let index = ls.indexOf('node_modules');
      if (index != -1) {
        let expectedTypescriptPath = path.join(project, ls[index], 'typescript', 'lib');
        try {
          fs.accessSync(expectedTypescriptPath);
          return expectedTypescriptPath;
        } catch (e) {
          // Ignore
        }
      }
    }
    // Use the built-in one
    return path.join(require.resolve("typescript"), "lib");
  }

  startServerProcess() {
    let nodeBin = this.getPathToNode();
    let bin = path.join(ROOT, 'node_modules', '@vue', 'language-server', 'bin', 'vue-language-server.js');
    return super.spawn(nodeBin, [bin, "--stdio"], {
      cwd: atom.project.getPaths[0] || __dirname
    });
  }

  getInitializeParams(projectPath, process) {
    const tsdk = this.findTypescriptPath();

    return {
      ...super.getInitializeParams(projectPath, process),
      documentSelector: [{ scheme: 'file', language: 'vue' }],
      initializationOptions: {
        typescript: { tsdk },
        vue: { hybridMode: false },
      },
    };
  }
}

module.exports = new VueLanguageClient();
