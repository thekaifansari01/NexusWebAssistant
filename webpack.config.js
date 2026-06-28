const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'nexus-assistant.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
};