/**
 * Production build entry point for immersive fullscreen experience
 * 没入型フルスクリーン体験のための本番ビルドエントリーポイント
 * 
 * Features resolution selection and automatic fullscreen playback
 * 解像度選択と自動フルスクリーン再生機能を搭載
 */
import { chromatiq, animateUniforms } from './index.common'

// for Webpack DefinePlugin
declare var NEORT: boolean;

window.addEventListener("load", ev => {
    let finished = false;

    // Inject production CSS styles
    // 本番用CSSスタイルを注入 (Inject production CSS styles)
    const style = document.createElement("style");
    style.innerText = require("../dist/style.prod.min.css").default;
    document.head.appendChild(style);

    // Hide cursor during fullscreen experience
    // フルスクリーン体験中はカーソルを非表示 (Hide cursor during fullscreen experience)
    document.addEventListener("fullscreenchange", () => {
        document.body.style.cursor = window.document.fullscreenElement ? "none" : "auto";
    });

    // Create UI container
    // UIコンテナを作成 (Create UI container)
    const container = document.createElement("div");
    container.className = "container";
    document.body.appendChild(container);

    // Resolution selection interface
    // 解像度選択インターフェース (Resolution selection interface)
    const resolutionMessage = document.createElement("p");
    resolutionMessage.innerHTML = "RESOLUTION: ";
    container.appendChild(resolutionMessage);

    const resolutionScale = document.createElement("select");
    if (NEORT) {
        // NEORT platform optimized settings / NEORT プラットフォーム最適化設定
        resolutionScale.innerHTML = `
    <option value="0.25">LOW 25%</option>
    <option value="0.5" selected>REGULAR 50%</option>
    <option value="0.75">REGULAR 75%</option>
    <option value="1.0">FULL 100%</option>
    `;
    } else {
        // Default settings for other platforms / 他プラットフォームのデフォルト設定
        resolutionScale.innerHTML = `
    <option value="0.25">LOW 25%</option>
    <option value="0.5">REGULAR 50%</option>
    <option value="0.75">REGULAR 75%</option>
    <option value="1.0" selected>FULL 100%</option>
    `;
    }
    resolutionMessage.appendChild(resolutionScale);

    const button = document.createElement("p");
    container.appendChild(button);
    button.innerHTML = "CLICK TO START";
    button.className = "button";
    button.onclick = () => {
        button.remove();
        resolutionMessage.remove();

        // loading animation
        // ローディングアニメーション (Loading animation)
        const loading = document.createElement("p");
        loading.innerHTML = 'LOADING <div class="lds-facebook"><div></div><div></div><div></div></div>';
        container.appendChild(loading);

        const loadingMessage = document.createElement("p");
        if (NEORT) {
            // Bilingual loading message for NEORT platform
            // NEORT プラットフォーム用のバイリンガルローディングメッセージ
            loadingMessage.innerHTML = "It takes about one minute. Please wait.<br> 読み込みに1分程度かかります。しばらくお待ち下さい。";
        } else {
            loadingMessage.innerHTML = "It takes about one minute. Please wait.";
        }
        loadingMessage.style.fontSize = "50px";
        container.appendChild(loadingMessage);

        document.body.requestFullscreen().then(() => {
            setTimeout(() => {
                chromatiq.onRender = (time, timeDelta) => {
                    animateUniforms(time, false, false);
                    // Auto-exit fullscreen when demo completes
                    // デモ完了時に自動的にフルスクリーンを終了 (Auto-exit fullscreen when demo completes)
                    if (!finished && time > chromatiq.timeLength + 2.0) {
                        document.exitFullscreen();
                        finished = true;
                    }
                }

                chromatiq.init();
                container.remove();

                // Dynamic resolution scaling based on user selection
                // ユーザー選択に基づく動的解像度スケーリング (Dynamic resolution scaling based on user selection)
                const onResize = () => {
                    const scale = parseFloat(resolutionScale.value);
                    chromatiq.setSize(window.innerWidth * scale, window.innerHeight * scale);
                };

                window.addEventListener("resize", onResize);
                onResize();

                // Start demo with slight delay for initialization
                // 初期化のための少しの遅延でデモを開始 (Start demo with slight delay for initialization)
                setTimeout(() => {
                    chromatiq.play();
                    chromatiq.playSound();
                }, 2500);
            }, 1000);
        });
    }
}, false);