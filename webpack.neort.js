/**
 * NEORT platform-specific build configuration
 * NEORTプラットフォーム専用ビルド設定
 * 
 * Optimized for the NEORT creative coding platform
 * NEORTクリエイティブコーディングプラットフォーム用に最適化
 */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const path = require('path');

module.exports = merge(common, {
    entry: './src/index.prod.ts', // Use production entry point / 本番エントリーポイントを使用
    mode: 'production',
    output: {
        filename: 'bundle.neort.js', // NEORT-specific bundle name / NEORT専用バンドル名
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(true), // Production mode / 本番モード
        GLOBAL_UNIFORMS: JSON.stringify(true), // Enable uniform controls / ユニフォームコントロールを有効化
        // PLAY_SOUND_FILE: JSON.stringify('200319_bgm_sketch.aac'), // External audio option / 外部オーディオオプション
        PLAY_SOUND_FILE: JSON.stringify(false), // GPU audio for optimal size / 最適サイズのためGPUオーディオ
        NEORT: JSON.stringify(true), // Enable NEORT-specific features / NEORT専用機能を有効化
    })],
});