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
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "manifest.json", to: "" },
        { from: "icons", to: "icons" },
        { from: "src/service-worker.js", to: "service-worker.js" },
        { from: "_redirects", to: "" },
      ],
    }),
    new HtmlWebpackPlugin({
      template: "./index.html",
      filename: "index.html",
    }),
  ],
  resolve: {
    extensions: [".js"],
  },
  experiments: {
    topLevelAwait: true,
  },
};
