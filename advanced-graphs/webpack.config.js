const path = require('path');

module.exports = {
  entry: './src/edit-dash.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'editor.js',
    library: 'AdvancedGraphs',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  }
};
