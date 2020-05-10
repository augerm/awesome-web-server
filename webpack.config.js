const path = require('path');

const sharedConfig = {
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
}
const clientConfig = {
  entry: './src/client-export.ts',
  target: 'web',
  ...sharedConfig,
  output: {
    path: path.resolve(__dirname, 'lib/server'),
    filename: 'index.js',
    library: 'awesome-web-server',
    libraryTarget: 'umd',
  },
};

const serverConfig = {
  entry: './src/server-export.ts',
  target: 'node',
  ...sharedConfig,
  output: {
    path: path.resolve(__dirname, 'lib/server'),
    filename: 'index.js',
    library: 'awesome-web-server',
    libraryTarget: 'umd',
  }
};

module.exports = [
  clientConfig,
  serverConfig,
];