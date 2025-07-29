/**
 * Development build configuration with hot reloading
 * ホットリロード付きの開発ビルド設定
 * 
 * Enables source maps, dev server, and debug features
 * ソースマップ、開発サーバー、デバッグ機能を有効化
 */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const path = require('path');

module.exports = merge(common, {
    entry: './src/index.dev.ts', // Development entry point / 開発エントリーポイント
    mode: 'development',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devtool: 'inline-source-map', // Enable source maps for debugging / デバッグ用ソースマップを有効化
    devServer: {
        inline: true,
        hot: true, // Hot module replacement / ホットモジュール置換
        contentBase: './dist',
    },
    plugins: [new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(false), // Development mode flag / 開発モードフラグ
        GLOBAL_UNIFORMS: JSON.stringify(true), // Enable global uniform debugging / グローバルユニフォームデバッグを有効化
        // PLAY_SOUND_FILE: JSON.stringify('200319_bgm_sketch.aac'), // External audio file option / 外部オーディオファイルオプション
        PLAY_SOUND_FILE: JSON.stringify(false), // Use GPU-generated audio / GPU生成オーディオを使用
    })],
});