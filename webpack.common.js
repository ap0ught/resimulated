/**
 * Shared webpack configuration for all build targets
 * 全ビルドターゲット用の共有webpack設定
 * 
 * Configures TypeScript, GLSL shader, and CSS loading
 * TypeScript、GLSLシェーダー、CSS読み込みを設定
 */
module.exports = {
    resolve: {
        extensions: ['.tsx', '.ts', '.js'], // File extensions to resolve / 解決するファイル拡張子
    },
    module: {
        rules: [
            {
                test: /\.glsl$/i,
                use: 'raw-loader', // Load GLSL shaders as raw strings / GLSLシェーダーを生文字列として読み込み
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: 'ts-loader', // TypeScript compilation / TypeScriptコンパイル
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: 'raw-loader', // Load CSS as raw strings for inline injection / インライン注入用にCSSを生文字列として読み込み
            },
        ],
    },
    /*plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        title: 'Production',
      }),
    ],*/
};