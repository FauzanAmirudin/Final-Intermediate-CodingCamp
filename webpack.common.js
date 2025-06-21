const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

// Determine publicPath based on environment variable (e.g., DEPLOY_ENV)
// For Netlify, it's usually '/', unless deployed to a specific subdirectory.
// For GitHub Pages, it's '/<repository-name>/'
const publicPath =
  process.env.DEPLOY_ENV === "github-pages"
    ? "/Project_FInal_Intermediate/"
    : "/";

module.exports = {
  entry: {
    main: "./src/scripts/index.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: publicPath, // Use the dynamically determined publicPath
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[name].[hash:8][ext]",
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "manifest.json", to: "" },
        { from: "icons", to: "icons" },
      ],
    }),
    new HtmlWebpackPlugin({
      template: "./index.html",
      filename: "index.html",
      scriptLoading: "defer",
      favicon: "./icons/favicon-32x32.png",
      meta: {
        viewport: "width=device-width, initial-scale=1.0",
        description: "Story App - Progressive Web App for sharing stories",
        "theme-color": "#000000",
      },
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      },
    }),
  ],
  resolve: {
    extensions: [".js"],
  },
  experiments: {
    topLevelAwait: true,
  },
};
