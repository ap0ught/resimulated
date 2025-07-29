/**
 * Production build configuration optimized for 64KB constraint
 * 64KB制約用に最適化された本番ビルド設定
 * 
 * Enables maximum compression and code minification
 * 最大圧縮とコード最小化を有効化
 */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const path = require('path');

module.exports = merge(common, {
    entry: './src/index.prod.ts', // Production entry point / 本番エントリーポイント
    mode: 'production', // Enable all production optimizations / 全ての本番最適化を有効化
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(true), // Production mode flag / 本番モードフラグ
        GLOBAL_UNIFORMS: JSON.stringify(true), // Include uniform support / ユニフォームサポートを含める
        // PLAY_SOUND_FILE: JSON.stringify('200319_bgm_sketch.aac'), // External audio file option / 外部オーディオファイルオプション
        PLAY_SOUND_FILE: JSON.stringify(false), // Use GPU-generated audio for size efficiency / サイズ効率のためGPU生成オーディオを使用
        NEORT: JSON.stringify(false), // Standard production build / 標準本番ビルド
    })],
});