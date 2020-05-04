const path = require('path');

module.exports = {
  entry: './src/index.ts',
  target: 'node',
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.js'
  }
};