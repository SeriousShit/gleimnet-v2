// @AngularClass

/*
 * Helper: root(), and rootDir() are defined at the bottom
 */
var sliceArgs = Function.prototype.call.bind(Array.prototype.slice);
var toString  = Function.prototype.call.bind(Object.prototype.toString);
var path = require('path');
var webpack = require('webpack');
// Webpack Plugins
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var ExtractTextPlugin = require("extract-text-webpack-plugin");

/*
 * Config
 */
module.exports = {
  // for faster builds use 'eval'
  devtool: 'source-map',
  debug: true,

  entry: {
    'vendor': './src/vendor.ts',
    'app': './src/bootstrap.ts', // our angular app
    'admin': './src/admin/adminbootstrap.ts' // our angular app
  },

  // Config for our build files
  output: {
    path: root('__build__'),
    filename: '[name].js',
    sourceMapFilename: '[name].map',
    chunkFilename: '[id].chunk.js'
  },

  resolve: {
    // ensure loader extensions match
    modulesDirectories: ["node_modules", "assets/sass"],
    extensions: ['','.ts','.js','.json', '.css', '.scss', '.html']
  },

  module: {
    preLoaders: [ { test: /\.ts$/, loader: 'tslint-loader' } ],
    loaders: [
      // Support for .ts files.
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        query: {
          'ignoreDiagnostics': [
            2403, // 2403 -> Subsequent variable declarations
            2300, // 2300 Duplicate identifier
            2374, // 2374 -> Duplicate number index signature
            2375  // 2375 -> Duplicate string index signature
          ]
        },
        exclude: [ /\.spec\.ts$/, /\.e2e\.ts$/, /node_modules/ ]
      },

      // Support for *.json files.
      { test: /\.json$/,  loader: 'json-loader' },

      // Support for CSS as raw text
      { test: /\.css$/,   loader: 'raw-loader' },
      //{
      //  test: /\.scss$/,
      //  loader: ExtractTextPlugin.extract(['style', 'css', 'sass'])
      //},
      { test: /\.scss$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader"),
      },
      {
        test: /\.(|woff|woff2|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=1024&name=fonts/[name].[ext]'
      },
      // support for .html as raw text
      { test: /\.html$/,  loader: 'raw-loader' },
      { test: /\.png$/,    loader: "url-loader?prefix=img/&limit=5000&name=img/[name].[ext]" },
      { test: /\.jpg$/,    loader: "url-loader?prefix=img/&limit=5000&name=img/[name].[ext]" },
      { test: /\.gif$/,    loader: "url-loader?prefix=img/&limit=5000&name=img/[name].[ext]" },
    ],
    noParse: [
     /zone\.js\/dist\/.+/,
     /reflect-metadata/,
     /es(6|7)-.+/,
    ]
  },

  sassLoader: {
    exclude: [ /\.jpg\.ts$/, /\.jpg/, /node_modules/ ]
  },

  plugins: [
    new CommonsChunkPlugin({ name: 'vendor', filename: 'vendor.js', minChunks: Infinity }),
    new CommonsChunkPlugin({ name: 'common', filename: 'common.js', minChunks: 2, chunks: ['app', 'vendor'] }),
    new ExtractTextPlugin("materialize-gleimhaus.css",{allChunks: false})
  ],

  // Other module loader config
  tslint: {
    emitErrors: false,
    failOnHint: false
  },
  // our Webpack Development Server config
  devServer: {
    historyApiFallback: true,
    contentBase: 'src/public',
    publicPath: '/__build__'
  }

};

// Helper functions

function root(args) {
  args = sliceArgs(arguments, 0);
  return path.join.apply(path, [__dirname].concat(args));
}

function rootNode(args) {
  args = sliceArgs(arguments, 0);
  return root.apply(path, ['node_modules'].concat(args));
}
