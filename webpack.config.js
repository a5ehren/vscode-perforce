//@ts-check

'use strict';

const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    clean: true, // Clean the output directory before emit
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },

  // Enable source maps for development
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',

  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    'typescript': 'commonjs typescript'
  },

  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
    // Enable modern module resolution
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.mjs': ['.mts', '.mjs']
    }
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                module: 'esnext',
                moduleResolution: 'node'
              }
            }
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    new ESLintPlugin({
      extensions: ['ts', 'js'],
      exclude: ['node_modules', 'dist'],
      fix: true
    })
  ],

  optimization: {
    minimize: process.env.NODE_ENV === 'production'
  },

  // Ensure proper Node.js handling
  node: {
    __dirname: false
  },

  // Enable performance hints for production
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false
  }
};

module.exports = config;