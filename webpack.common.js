/**
 * Webpack Common Configuration
 * 
 * This file contains shared webpack configuration settings used across
 * all build targets (development, production, NEORT). It defines how
 * different file types are processed and bundled.
 * 
 * The configuration is optimized for 64KB intro development, focusing
 * on minimal bundle size and efficient resource handling.
 */

module.exports = {
    /**
     * Module Resolution Configuration
     * 
     * Defines which file extensions webpack should resolve automatically.
     * This allows imports without explicit file extensions.
     */
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },

    /**
     * Module Processing Rules
     * 
     * Defines how different file types are transformed during the build process.
     * Each rule specifies a file pattern and the loader(s) to apply.
     */
    module: {
        rules: [
            /**
             * GLSL Shader Processing
             * 
             * Loads GLSL shader files as raw text strings. This allows
             * shaders to be imported directly into TypeScript/JavaScript
             * modules for WebGL compilation.
             */
            {
                test: /\.glsl$/i,
                use: 'raw-loader',
            },
            /**
             * TypeScript Compilation
             * 
             * Compiles TypeScript files to JavaScript with type checking.
             * Excludes node_modules to improve build performance.
             */
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            /**
             * CSS Processing
             * 
             * Loads CSS files as raw text strings for inline injection.
             * This eliminates separate CSS file requests, reducing bundle size
             * and improving loading performance.
             */
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: 'raw-loader',
            },
        ],
    },

    /**
     * Plugin Configuration (Commented Out)
     * 
     * The following plugins are available but currently disabled:
     * - CleanWebpackPlugin: Cleans output directory before build
     * - HtmlWebpackPlugin: Generates HTML with automatic script injection
     * 
     * These are disabled to maintain manual control over the final HTML
     * structure, which is important for 64KB intro optimization.
     */
    /*plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        title: 'Production',
      }),
    ],*/
};