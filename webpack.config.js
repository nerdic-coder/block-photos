const path = require('path');

// copy manifest.json to the path: 'public/build'
// this will allow for the authRequest to see the file at www.example.com/manifest.json
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HeadersPlugin = new CopyWebpackPlugin([{ from: 'public/', to: '.' }]);
const IonicDistPlugin = new CopyWebpackPlugin([ { from: 'node_modules/@ionic/core/dist', to: 'ionic' } ]);
const WorkboxPlugin = require('workbox-webpack-plugin');

const HtmlWebpackPlugin = require('html-webpack-plugin');

let PUBLIC_PATH = './';

process.argv.forEach(function (val) {
  if (val.includes('target=web')) {
    PUBLIC_PATH = '/';
  }
});

const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
  template: './public/index.html',
  filename: 'index.html',
  inject: 'body',
  base: PUBLIC_PATH
});

module.exports = {
  entry: ['@babel/polyfill', './src/index.js'],
  target: 'electron-main',
  output: {
    path: path.resolve('www'),
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    publicPath: PUBLIC_PATH
  },
  devServer: {
    https: false,
    historyApiFallback: {
      disableDotRule: true
    },
    watchOptions: { aggregateTimeout: 300, poll: 1000 },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
    },
    port: 9876
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /\.(\/node_modules\/|\/build\/|\/electron\/|\/src\/server.js)(\?\S*)?$/
      },
      { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },
      {
        test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/,
        loader: 'file-loader!url-loader',
      },
      { test: /\.css$/, loader: 'style-loader!css-loader' }
    ]
  },
  plugins: [HtmlWebpackPluginConfig, IonicDistPlugin, HeadersPlugin,
    new WorkboxPlugin.InjectManifest({
      swSrc: './public/service-worker.js',
    })
  ]
}
