const path = require('path');

module.exports = {
  entry: './index.js',
  mode: 'production',
  experiments: {
    outputModule: true,
  },
  output: {
    filename: 'ayva.dist.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'module',
    }
  },
};
