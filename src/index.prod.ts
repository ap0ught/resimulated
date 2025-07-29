/**
 * RE: SIMULATED - Production Build Entry Point
 * 
 * This is the entry point for the production version of the demo.
 * It provides a minimal, fullscreen experience optimized for the
 * 64KB intro format with automatic playback and resolution scaling.
 * 
 * Features:
 * - Automatic fullscreen mode with cursor hiding
 * - Resolution scaling options for performance
 * - Automatic demo exit after completion
 * - Minimal UI for size optimization
 */

import { chromatiq, animateUniforms } from './index.common'

/**
 * Webpack DefinePlugin variable for NEORT platform detection
 */
declare var NEORT: boolean;

/**
 * Production Build Initialization
 * 
 * This setup creates a streamlined experience suitable for competitions
 * and final distribution. The interface is minimal to focus attention
 * on the visual content.
 */
window.addEventListener("load", ev => {
    let finished = false;

    /**
     * Dynamic CSS Injection
     * 
     * In production builds, CSS is embedded directly into the bundle
     * to minimize HTTP requests and loading time.
     */
    const style = document.createElement("style");
    style.innerText = require("../dist/style.prod.min.css").default;
    document.head.appendChild(style);

    /**
     * Fullscreen Mode Management
     * 
     * Automatically hide the cursor when entering fullscreen mode
     * to create an immersive viewing experience.
     */
    document.addEventListener("fullscreenchange", () => {
        document.body.style.cursor = window.document.fullscreenElement ? "none" : "auto";
    });

    /**
     * User Interface Container
     * 
     * Creates a minimal overlay with resolution controls and start button.
     * This UI is removed once the demo begins to maximize visual impact.
     */
    const container = document.createElement("div");
    container.className = "container";
    document.body.appendChild(container);

    /**
     * Resolution Scaling Controls
     * 
     * Allows users to adjust rendering resolution for performance.
     * Lower resolutions maintain visual quality while improving
     * performance on weaker hardware.
     */
    const resolutionMessage = document.createElement("p");
    resolutionMessage.innerHTML = "RESOLUTION: ";
    container.appendChild(resolutionMessage);

    const resolutionScale = document.createElement("select");
    if (NEORT) {
        /**
         * NEORT Platform Optimization
         * 
         * NEORT (web-based demo platform) users typically have varied
         * hardware capabilities, so default to 50% resolution for
         * better compatibility.
         */
        resolutionScale.innerHTML = `
    <option value="0.25">LOW 25%</option>
    <option value="0.5" selected>REGULAR 50%</option>
    <option value="0.75">REGULAR 75%</option>
    <option value="1.0">FULL 100%</option>
    `;
    } else {
        /**
         * Standard Distribution
         * 
         * For direct distribution (competitions, downloads), default
         * to full resolution to showcase maximum visual quality.
         */
        resolutionScale.innerHTML = `
    <option value="0.25">LOW 25%</option>
    <option value="0.5">REGULAR 50%</option>
    <option value="0.75">REGULAR 75%</option>
    <option value="1.0" selected>FULL 100%</option>
    `;
    }
    resolutionMessage.appendChild(resolutionScale);

    /**
     * Demo Start Button
     */
    const button = document.createElement("p");
    container.appendChild(button);
    button.innerHTML = "CLICK TO START";
    button.className = "button";
    button.onclick = () => {
        /**
         * UI Cleanup
         * 
         * Remove interface elements to prepare for fullscreen demo.
         */
        button.remove();
        resolutionMessage.remove();

        /**
         * Loading Animation
         * 
         * Display loading indicator while shaders compile and resources
         * initialize. Shader compilation can take significant time,
         * especially on mobile devices.
         */
        const loading = document.createElement("p");
        loading.innerHTML = 'LOADING <div class="lds-facebook"><div></div><div></div><div></div></div>';
        container.appendChild(loading);

        const loadingMessage = document.createElement("p");
        if (NEORT) {
            /**
             * Bilingual loading message for NEORT's international audience
             */
            loadingMessage.innerHTML = "It takes about one minute. Please wait.<br> 読み込みに1分程度かかります。しばらくお待ち下さい。";
        } else {
            loadingMessage.innerHTML = "It takes about one minute. Please wait.";
        }
        loadingMessage.style.fontSize = "50px";
        container.appendChild(loadingMessage);

        /**
         * Fullscreen Demo Initialization
         * 
         * Enter fullscreen mode and begin the demo initialization process.
         * The delay ensures smooth transition and gives the browser time
         * to complete the fullscreen transition.
         */
        document.body.requestFullscreen().then(() => {
            setTimeout(() => {
                /**
                 * Animation and Completion Handling
                 * 
                 * Set up the main animation loop and automatic exit logic.
                 * The demo automatically exits fullscreen 2 seconds after
                 * the main content finishes.
                 */
                chromatiq.onRender = (time, timeDelta) => {
                    animateUniforms(time, false, false);
                    if (!finished && time > chromatiq.timeLength + 2.0) {
                        document.exitFullscreen();
                        finished = true;
                    }
                }

                /**
                 * Engine Initialization
                 */
                chromatiq.init();
                container.remove();

                /**
                 * Dynamic Resolution Scaling
                 * 
                 * Apply the selected resolution scale to the rendering canvas.
                 * This affects performance but maintains visual quality through
                 * browser upscaling.
                 */
                const onResize = () => {
                    const scale = parseFloat(resolutionScale.value);
                    chromatiq.setSize(window.innerWidth * scale, window.innerHeight * scale);
                };

                window.addEventListener("resize", onResize);
                onResize();

                /**
                 * Demo Playback Start
                 * 
                 * Begin both visual and audio playback with a slight delay
                 * to ensure everything is properly initialized.
                 */
                setTimeout(() => {
                    chromatiq.play();
                    chromatiq.playSound();
                }, 2500);
            }, 1000);
        });
    }
}, false);