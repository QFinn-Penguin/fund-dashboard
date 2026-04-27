const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const ejs = require('ejs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ExtensionReloader = require('webpack-extension-reloader');
const {
  VueLoaderPlugin
} = require('vue-loader');
const {
  version
} = require('./package.json');

const allEntries = {
  'background': './background.js',
  'content/bridge': './content/bridge.js',
  'page/holdings-bridge': './page/holdings-bridge.js',
  'popup/popup': './popup/popup.js',
  'options/options': './options/options.js',
};
function resolveRequestedEntry(env = {}) {
  return env.entry || process.env.npm_config_env_entry || process.env.WEBPACK_ENTRY || '';
}

function resolveRequestedMode(env = {}) {
  return env.mode || process.env.npm_config_env_mode || process.env.NODE_ENV || 'production';
}

module.exports = (env = {}) => {
  const requestedEntry = resolveRequestedEntry(env);
  const requestedMode = resolveRequestedMode(env);
  const selectedEntries = requestedEntry && allEntries[requestedEntry]
    ? {
        [requestedEntry]: allEntries[requestedEntry],
      }
    : allEntries;

  const config = {
    mode: requestedMode,
    devtool: false,
    context: __dirname + '/src',
    entry: selectedEntries,
    output: {
      path: __dirname + '/dist',
      filename: '[name].js',
      publicPath: '/',
    },
    resolve: {
      extensions: ['.js', '.vue'],
    },
    module: {
      rules: [{
          test: /\.vue$/,
          loaders: 'vue-loader',
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.scss$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        },
        {
          test: /\.sass$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader?indentedSyntax'],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
            outputPath: '/images/',
            emitFile: true,
            esModule: false,
          },
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
            outputPath: '/fonts/',
            emitFile: true,
            esModule: false,
          },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        global: 'window',
      }),
      new VueLoaderPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new CopyPlugin([{
          from: 'icons',
          to: 'icons',
          ignore: ['icon.xcf']
        },
        {
          from: 'popup/popup.html',
          to: 'popup/popup.html',
          transform: (content) => transformHtml(content, requestedMode)
        },
        {
          from: 'options/options.html',
          to: 'options/options.html',
          transform: (content) => transformHtml(content, requestedMode)
        },
        {
          from: 'manifest.json',
          to: 'manifest.json',
          transform: (content) => {
            const jsonContent = JSON.parse(content);
            jsonContent.version = version;

            if (config.mode === 'development') {
              jsonContent['content_security_policy'] = {
                extension_pages: "script-src 'self'; object-src 'self'"
              };
            }

            return JSON.stringify(jsonContent, null, 2);
          },
        },
      ]),
    ],
  };

  if (config.mode === 'production') {
    config.optimization = {
      minimizer: [
        new TerserPlugin({
          parallel: 1,
        }),
      ],
    };
    config.plugins = (config.plugins || []).concat([
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"',
        },
      }),
    ]);
  }

  if (process.env.HMR === 'true') {
    config.plugins = (config.plugins || []).concat([
      new ExtensionReloader({
        manifest: __dirname + '/src/manifest.json',
      }),
    ]);
  }

  return config;
};

function transformHtml(content) {
  return ejs.render(content.toString(), {
    ...process.env,
    NODE_ENV: arguments[1] || process.env.NODE_ENV || 'production',
  });
}
