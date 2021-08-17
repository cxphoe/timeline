const copyWebpackPlugin = require('copy-webpack-plugin');

const {
  resolve,
  join,
  PUBLIC_PATH,
  ROOT_PATH,
  STATIC_PATH,
  getEntriesWithPolyfill,
} = require('./common');

module.exports = {
  entry: getEntriesWithPolyfill(),
  module: {
    rules: [
      {
        test: /\.js$/,
        include: /[\\/]src[\\/]/,
        use: 'babel-loader?cacheDirectory=true',
      },
      {
        test: /\.(png|jpg|gif|ico)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'img/[name].[ext]?v=[hash:10]',
              outputPath: STATIC_PATH,
            },
          },
        ],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              attrs: ['img:src'],
              removeComments: true,
              minifyJS: true,
              minifyCSS: true,
            },
          },
        ],
      },
    ],
  },
  output: {
    chunkFilename: join(STATIC_PATH, 'js/[name].js?v=[chunkhash:10]'),
    filename: join(STATIC_PATH, 'js/[name].js?v=[hash:10]'),
    path: ROOT_PATH,
    publicPath: PUBLIC_PATH,
  },
  plugins: [
    // copy static files
    new copyWebpackPlugin([
      { from: resolve('../src/static'), to: join(ROOT_PATH, STATIC_PATH) },
    ]),
  ],
  resolve: {
    alias: {
      '@components': resolve('../src/components'),
      '@common': resolve('../src/common'),
      '@utils': resolve('../src/utils'),
      '@': resolve('../src'),
    },
    extensions: [ '.ts', '.js'],
  },
};
