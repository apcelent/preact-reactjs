var path = require('path');
var webpack = require('webpack');

module.exports = {
    devServer: {
        inline: true,
        contentBase: './src',
        port: 3000
    },
    devtool: 'cheap-module-eval-source-map',
    entry: './dev/js/components/GoogleApp.js',
    module: {
        loaders: [
            {
                test: /\.js$/,
                loaders: ['babel'],
                exclude: /node_modules/
            },
            {
                test: /\.scss/,
                loader: 'style-loader!css-loader!sass-loader'
            }
        ]
    },
    output: {
        path: 'src',
        filename: 'js/bundle.min.js'
    },

    resolve: {
        extensions: ['', '.js', '.jsx'],
        "alias": {
            "react": "preact-compat",
            "react-dom": "preact-compat"
        }
    },
    
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin()
    ]
};
