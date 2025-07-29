/**
 * Webpack Production Configuration
 * 
 * This configuration creates the final production build optimized for
 * 64KB intro competitions and distribution. It enables aggressive
 * optimizations and injects production-specific environment variables.
 * 
 * The output is processed by pnginator.rb to create the final HTML file
 * with embedded JavaScript for maximum size efficiency.
 */

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const path = require('path');

module.exports = merge(common, {
    /**
     * Entry Point Configuration
     * 
     * Uses the production-specific entry point which provides a minimal
     * interface and automatic fullscreen experience.
     */
    entry: './src/index.prod.ts',

    /**
     * Build Mode Configuration
     * 
     * Production mode enables:
     * - Code minification and obfuscation
     * - Dead code elimination
     * - Scope hoisting for smaller bundle size
     * - Optimized chunk splitting
     */
    mode: 'production',

    /**
     * Output Configuration
     * 
     * Specifies where and how the built files are generated.
     * The bundle.js file is further processed by pnginator.rb
     * to create the final resimulated.html file.
     */
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },

    /**
     * Build-time Variable Injection
     * 
     * DefinePlugin injects compile-time constants that allow conditional
     * compilation and feature toggling without runtime overhead.
     */
    plugins: [new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(true),           // Enable production optimizations
        GLOBAL_UNIFORMS: JSON.stringify(true),     // Enable uniform management system
        // PLAY_SOUND_FILE: JSON.stringify('200319_bgm_sketch.aac'), // External audio file (disabled)
        PLAY_SOUND_FILE: JSON.stringify(false),    // Use procedural GPU audio instead
        NEORT: JSON.stringify(false),              // Standard distribution (not NEORT platform)
    })],
});