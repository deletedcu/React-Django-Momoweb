var webpack = require('webpack');
var path = require('path');

//var PROD = JSON.parse(process.env.PROD_ENV || '0');
var PROD = 1;

module.exports = {
  entry: {
    'bundle': './static/js/main.js',
    'pusher': './static/js/push.jsx',
    'firebase-messaging-sw': './static/js/firebase-messaging-sw.jsx'
  },
  output: {
    path: path.join(__dirname, "static/js/"),
    filename: "[name].js"
  },
  module: {
    loaders: [
      { test: /\.coffee$/, loader: 'coffee-loader' },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react', 'stage-1']
        },
        exclude: /\/node_modules\//
      },

    ]
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false,
            unsafe: true
        }
    })
  ],
  resolve: {
    // you can now require('file') instead of require('file.coffee')
    extensions: ['', '.js', '.jsx', '.json', '.coffee'] 
  }
};
