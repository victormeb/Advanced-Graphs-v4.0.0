const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  filenameHashing: false,
  pages: {
    testingEditor: {
      entry: 'src/test-edit-dash.js',
      template: 'public/testingEditor.html',
      filename: 'testingEditor.html',
      title: 'Testing Editor',
      chunks: ['chunk-vendors', 'chunk-common', 'testingEditor'],
    },
    editor: {
      entry: 'src/edit-dash.js',
      output: {
        filename: 'editor.js',
        path: 'dist',
        chunks: ['chunk-vendors', 'chunk-common', 'editor'],
      }
    }
  },
})
