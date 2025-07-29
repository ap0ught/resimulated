/**
 * Webpack NEORT Platform Configuration
 * 
 * This configuration creates a build specifically optimized for the
 * NEORT platform (https://neort.io) - a web-based creative coding
 * and demo showcase platform. The build includes platform-specific
 * optimizations and user experience adjustments.
 */

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const path = require('path');

module.exports = merge(common, {
    /**
     * Production Entry Point
     * 
     * Uses the same production entry as the standard build, but with
     * NEORT-specific environment variables that adjust the user experience
     * for the platform's audience and technical constraints.
     */
    entry: './src/index.prod.ts',

    /**
     * Production Mode
     * 
     * Enables full optimization for the NEORT platform deployment.
     * The platform serves many demos, so size optimization is crucial.
     */
    mode: 'production',

    /**
     * NEORT-Specific Output
     * 
     * Creates a separate bundle file specifically for NEORT deployment.
     * This allows maintaining different builds for different platforms
     * without conflicts.
     */
    output: {
        filename: 'bundle.neort.js',
        path: path.resolve(__dirname, 'dist'),
    },

    /**
     * NEORT Platform Environment Variables
     * 
     * These compile-time constants configure the demo for NEORT:
     * - PRODUCTION: true - enables all optimizations
     * - GLOBAL_UNIFORMS: true - enables parameter management
     * - PLAY_SOUND_FILE: false - uses GPU audio (NEORT prefers this)
     * - NEORT: true - enables NEORT-specific UI and behavior adjustments
     */
    plugins: [new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(true),
        GLOBAL_UNIFORMS: JSON.stringify(true),
        // PLAY_SOUND_FILE: JSON.stringify('200319_bgm_sketch.aac'), // External audio disabled
        PLAY_SOUND_FILE: JSON.stringify(false),
        NEORT: JSON.stringify(true),            // Enable NEORT platform optimizations
    })],
});