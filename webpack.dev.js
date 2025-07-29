/**
 * Webpack Development Configuration
 * 
 * This configuration is optimized for development workflow with features
 * like hot reloading, source maps, and debugging tools. It uses the
 * development entry point which includes dat.GUI for parameter tweaking
 * and various debugging utilities.
 */

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const path = require('path');

module.exports = merge(common, {
    /**
     * Development Entry Point
     * 
     * Uses index.dev.ts which includes debugging UI, parameter controls,
     * and development-specific features like camera manipulation and
     * frame capture utilities.
     */
    entry: './src/index.dev.ts',

    /**
     * Development Mode
     * 
     * Enables faster builds with readable output and comprehensive
     * error reporting. Disables optimizations that slow down development.
     */
    mode: 'development',

    /**
     * Output Configuration
     * 
     * Development builds use the same output structure as production
     * but prioritize build speed over size optimization.
     */
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },

    /**
     * Source Map Generation
     * 
     * Inline source maps provide detailed debugging information
     * by mapping minified code back to original TypeScript sources.
     * This enables proper debugging in browser dev tools.
     */
    devtool: 'inline-source-map',

    /**
     * Development Server Configuration
     * 
     * Webpack dev server provides:
     * - Live reloading on file changes
     * - Hot module replacement for faster iteration
     * - Local development server with proper MIME types
     */
    devServer: {
        inline: true,               // Enable live reloading
        hot: true,                  // Enable hot module replacement
        contentBase: './dist',      // Serve files from dist directory
    },

    /**
     * Development Environment Variables
     * 
     * These compile-time constants configure the engine for development:
     * - PRODUCTION: false - enables debug features and verbose logging
     * - GLOBAL_UNIFORMS: true - enables the uniform management system
     * - PLAY_SOUND_FILE: false - uses GPU-generated audio instead of files
     */
    plugins: [new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(false),
        GLOBAL_UNIFORMS: JSON.stringify(true),
        // PLAY_SOUND_FILE: JSON.stringify('200319_bgm_sketch.aac'), // External audio option
        PLAY_SOUND_FILE: JSON.stringify(false),
    })],
});