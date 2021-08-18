import path from 'path';
import nodeExternals from 'webpack-node-externals';

export const config = {
  entry: './index.ts',
  devtool: 'inline-source-map',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'i3-config-parser.js',
    library: {
      name: 'i3ConfigParser',
      type: 'umd',
    },
  },
}

