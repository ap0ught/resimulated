/**
 * Webpack DefinePlugin global variables
 * These are injected during the build process to provide environment-specific configuration
 */
declare var PRODUCTION: boolean;
declare var GLOBAL_UNIFORMS: boolean;
declare var PLAY_SOUND_FILE: string;

/**
 * Rendering pass type definitions.
 * 
 * Using const objects instead of TypeScript enums to minimize bundle size
 * in the 64KB intro constraint. Enums generate additional JavaScript code
 * that increases the final bundle size.
 * 
 * Reference: https://twitter.com/gam0022/status/1236668659285647368
 */
const PassType = {
    Image: 0 as const,          // Standard image rendering pass
    FinalImage: 1 as const,     // Final composition pass  
    Bloom: 2 as const,          // Bloom post-processing pass
    BloomUpsample: 3 as const,  // Bloom upsampling pass
    Sound: 4 as const,          // Sound generation pass
}

type PassType = typeof PassType[keyof typeof PassType]

/**
 * Represents a single rendering pass in the graphics pipeline.
 * Each pass encapsulates a shader program, its uniforms, and render targets.
 */
class Pass {
    type: PassType;                                          // The type of rendering pass
    index: number;                                           // Pass index in the pipeline
    program: WebGLProgram;                                   // Compiled shader program
    uniforms: { [index: string]: { type: string, value: any } }; // Uniform variable definitions
    locations: { [index: string]: WebGLUniformLocation };   // Cached uniform locations
    frameBuffer: WebGLFramebuffer;                           // Render target framebuffer
    texture: WebGLTexture;                                   // Output texture
    scale: number;                                           // Rendering resolution scale factor
}

/**
 * Audio texture dimensions for sound synthesis.
 * These define the resolution of the texture used for audio generation
 * in the GPU-based sound shader system.
 */
const SOUND_WIDTH = 512;
const SOUND_HEIGHT = 512;

/**
 * Chromatiq - A WebGL Engine for 64KB Intros
 * 
 * This is a lightweight WebGL rendering engine designed specifically for
 * creating 64KB intros - a type of real-time graphics demo with strict
 * file size constraints. The engine provides essential features like
 * multi-pass rendering, bloom effects, and GPU-based sound synthesis
 * while maintaining minimal code size.
 * 
 * Key Features:
 * - Multi-pass image shader rendering
 * - Built-in bloom post-processing
 * - GPU-based sound synthesis (GLSL Sound)
 * - Uniform animation system
 * - Minimal memory footprint
 */
export class Chromatiq {
    /** The total duration of the demo/animation in seconds */
    timeLength: number;

    /** Flag indicating whether the demo is currently playing */
    isPlaying: boolean;

    /** 
     * Forces a render update even when paused (isPlaying = false).
     * Useful for debugging and manual frame stepping.
     */
    needsUpdate: boolean;

    /** Current playback time in seconds */
    time: number;

    /** 
     * Callback function executed before rendering each frame.
     * Only called when playing (isPlaying = true).
     * Use this to animate uniforms and update per-frame parameters.
     */
    onRender: (time: number, timeDelta: number) => void;

    /** 
     * Callback function executed every frame regardless of play state.
     * Called even when paused (isPlaying = false).
     * Use this for UI updates and non-time-dependent logic.
     */
    onUpdate: () => void;

    canvas: HTMLCanvasElement;
    audioContext: AudioContext;
    audioSource: AudioBufferSourceNode;

    /**
     * Global uniform variable definitions.
     * This array defines all animatable parameters exposed to shaders,
     * including their initial values, ranges, and UI grouping.
     */
    uniformArray: { key: string, initValue: any, min?: number, max?: number, group?: string }[];

    /** 
     * Runtime uniform values accessible from external code.
     * Modify these values to create animations and interactive effects.
     * Changes are automatically synchronized with GPU shaders.
     */
    uniforms: { [key: string]: any };

    init: () => void;
    render: () => void;
    setSize: (width: number, height: number) => void;
    play: () => void;
    playSound: () => void;
    stopSound: () => void;

    /** 
     * Debug parameter for isolating specific rendering passes.
     * Set to the index of an imageShader to render only that pass.
     * Special values:
     * - -1: Disable debug mode (normal rendering)
     * - 30: Show text texture
     * - Any valid imageShader index: Show only that pass
     */
    debugFrameNumber: number;

    /**
     * Creates a new Chromatiq engine instance.
     * 
     * @param timeLength - Duration of the demo in seconds
     * @param vertexShader - Vertex shader source code for all passes
     * @param imageCommonHeaderShader - Common header included in all image shaders
     * @param imageShaders - Array of fragment shader sources for image rendering
     * @param bloomPassBeginIndex - Index of the first pass that should receive bloom
     * @param bloomDonwsampleIterations - Number of bloom downsampling iterations
     * @param bloomPrefilterShader - Shader for bloom brightness threshold filtering
     * @param bloomDownsampleShader - Shader for bloom downsampling passes
     * @param bloomUpsampleShader - Shader for bloom upsampling passes  
     * @param bloomFinalShader - Shader for final bloom composition
     * @param soundShader - GLSL shader for procedural sound generation
     * @param createTextTexture - Function to generate text texture for the engine
     */
    constructor(
        timeLength: number,
        vertexShader: string,
        imageCommonHeaderShader: string,
        imageShaders: string[],

        bloomPassBeginIndex: number,
        bloomDonwsampleIterations: number,
        bloomPrefilterShader: string,
        bloomDownsampleShader: string,
        bloomUpsampleShader: string,
        bloomFinalShader: string,

        soundShader: string,
        createTextTexture: (gl: WebGL2RenderingContext) => WebGLTexture,
    ) {
        /**
         * Method Definition Strategy for Size Optimization
         * 
         * To minimize bundle size in the 64KB constraint, methods are defined
         * dynamically within the constructor rather than as class methods.
         * This reduces 'this' references and overall code size.
         * 
         * Only data that needs external access is defined as class fields.
         */
        this.init = () => {
            /**
             * Initialize Engine State
             */
            this.timeLength = timeLength;
            this.isPlaying = true;
            this.needsUpdate = false;
            this.time = 0;
            this.debugFrameNumber = -1;

            /**
             * Global Uniforms System
             * Initialize the uniform management system if enabled.
             * This system allows dynamic control of shader parameters.
             */
            if (GLOBAL_UNIFORMS) {
                this.uniformArray = [];
                this.uniforms = {};
            }

            /**
             * WebAudio Context Initialization
             * Create the audio context for sound playback and synthesis.
             */
            const audio = this.audioContext = new window.AudioContext();

            /**
             * Canvas and WebGL Context Setup
             * Create the rendering canvas and WebGL2 context with required extensions.
             */
            const canvas = this.canvas = document.createElement("canvas");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            window.document.body.appendChild(canvas);

            /**
             * WebGL2 Context Creation
             * WebGL2 provides essential features like 3D textures and transform feedback.
             * Supported from Firefox 51+ and Chrome 56+.
             * preserveDrawingBuffer is enabled for screenshot/recording functionality.
             */
            const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
            if (!gl) {
                console.log("WebGL 2 is not supported...");
                return;
            }

            /**
             * Essential WebGL Extensions
             * These extensions are required for high-quality rendering:
             * - EXT_color_buffer_float: Enables float render targets for HDR
             * - OES_texture_float_linear: Enables linear filtering on float textures
             */
            const ext = gl.getExtension("EXT_color_buffer_float");
            if (!ext) {
                alert("need EXT_color_buffer_float");
                return;
            }

            const ext2 = gl.getExtension("OES_texture_float_linear");
            if (!ext2) {
                alert("need OES_texture_float_linear");
                return;
            }

            /**
             * Basic OpenGL State Setup
             */
            gl.enable(gl.CULL_FACE);

            /**
             * Fullscreen Quad Geometry Setup
             * Creates a simple quad that covers the entire viewport.
             * All rendering is done using image shaders on this quad.
             */
            const vert2d = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
            const vert2dData = new Float32Array([].concat(...vert2d));
            const vertBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
            gl.bufferData(gl.ARRAY_BUFFER, vert2dData, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            /**
             * Index Buffer for Quad Triangulation
             * Defines two triangles that form the fullscreen quad.
             */
            const index = [[0, 1, 2], [3, 2, 1]];
            const indexData = new Uint16Array([].concat(...index));
            const indexBuf = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            /**
             * Vertex Array Object (VAO) Setup
             * VAOs encapsulate vertex attribute state for efficient rendering.
             */
            const vertexArray = gl.createVertexArray();
            const setupVAO = (program: WebGLProgram) => {
                gl.bindVertexArray(vertexArray);
                // bind buffer data
                gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);

                // set attribute types
                const vert2dId = gl.getAttribLocation(program, "vert2d");
                const elem = gl.FLOAT, count = vert2d[0].length, normalize = false;
                const offset = 0, stride = count * Float32Array.BYTES_PER_ELEMENT;
                gl.enableVertexAttribArray(vert2dId);
                gl.vertexAttribPointer(vert2dId, count, elem, normalize, stride, offset);
                gl.bindVertexArray(null);
                // NOTE: these unbound buffers is not required; works fine if unbound
                // gl.bindBuffer(gl.ARRAY_BUFFER, null);
                // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            };

            const textTexture = createTextTexture(gl);

            const imageCommonHeaderShaderLineCount = imageCommonHeaderShader.split("\n").length;

            const loadShader = (src: string, type: number) => {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, src);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    if (PRODUCTION) {
                        const log = gl.getShaderInfoLog(shader);
                        console.log(src, log);
                    } else {
                        if (src.includes("mainSound")) {
                            const log = gl.getShaderInfoLog(shader);
                            console.log(src, log);
                        } else {
                            // NOTE: CommonHeaderを考慮してエラーの行番号を変換します
                            const log = gl.getShaderInfoLog(shader).replace(/(\d+):(\d+)/g, (match: string, p1: string, p2: string) => {
                                const line = parseInt(p2);
                                if (line <= imageCommonHeaderShaderLineCount) {
                                    return `${p1}:${line} (common header)`;
                                } else {
                                    return `${p1}:${line - imageCommonHeaderShaderLineCount}`;
                                }
                            });
                            console.log(src, log);
                        }
                    }
                }
                return shader;
            };

            const loadProgram = (fragmentShader: string) => {
                const shaders = [
                    loadShader(vertexShader, gl.VERTEX_SHADER),
                    loadShader(fragmentShader, gl.FRAGMENT_SHADER)
                ];
                const program = gl.createProgram();
                shaders.forEach(shader => gl.attachShader(program, shader));
                gl.linkProgram(program);
                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    console.log(gl.getProgramInfoLog(program));
                }
                return program;
            };

            const createLocations = (pass: Pass) => {
                const locations: { [index: string]: WebGLUniformLocation } = {};
                Object.keys(pass.uniforms).forEach(key => {
                    locations[key] = gl.getUniformLocation(pass.program, key);
                });
                return locations;
            };

            const setupFrameBuffer = (pass: Pass) => {
                // NOTE: 最終パスならフレームバッファは不要なので生成しません
                if (pass.type === PassType.FinalImage) {
                    return;
                }

                let width = pass.uniforms.iResolution.value[0];
                let height = pass.uniforms.iResolution.value[1];
                let type = gl.FLOAT;
                let format = gl.RGBA32F;
                let filter = gl.LINEAR;

                if (pass.type === PassType.Sound) {
                    width = SOUND_WIDTH;
                    height = SOUND_HEIGHT;
                    type = gl.UNSIGNED_BYTE;
                    format = gl.RGBA;
                    filter = gl.NEAREST;
                }

                // フレームバッファを生成します
                pass.frameBuffer = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, pass.frameBuffer);

                // フレームバッファ用テクスチャを生成します
                pass.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, pass.texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, gl.RGBA, type, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                // フレームバッファにテクスチャを関連付けます
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.texture, 0);

                // 各種オブジェクトのバインドを解除します
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            };

            const initPass = (program: WebGLProgram, index: number, type: PassType, scale: number) => {
                setupVAO(program);
                const pass = new Pass();
                pass.program = program;
                pass.index = index;
                pass.type = type;
                pass.scale = scale;

                pass.uniforms = {
                    iResolution: { type: "v3", value: [canvas.width * pass.scale, canvas.height * pass.scale, 0] },
                    iTime: { type: "f", value: 0.0 },
                    iPrevPass: { type: "t", value: Math.max(pass.index - 1, 0) },
                    iBeforeBloom: { type: "t", value: Math.max(bloomPassBeginIndex - 1, 0) },
                    iBlockOffset: { type: "f", value: 0.0 },
                    iSampleRate: { type: "f", value: audio.sampleRate },
                    iTextTexture: { type: "t", value: 0 },
                };

                if (type === PassType.BloomUpsample) {
                    const bloomDonwsampleEndIndex = bloomPassBeginIndex + bloomDonwsampleIterations;
                    const upCount = index - bloomDonwsampleEndIndex;
                    pass.uniforms.iPairBloomDown = { type: "t", value: index - upCount * 2 };
                }

                if (GLOBAL_UNIFORMS) {
                    this.uniformArray.forEach(unifrom => {
                        pass.uniforms[unifrom.key] = { type: typeof unifrom.initValue === "number" ? "f" : "v3", value: unifrom.initValue };
                    });
                }

                pass.locations = createLocations(pass);

                setupFrameBuffer(pass);
                return pass;
            };

            const renderPass = (pass: Pass) => {
                gl.useProgram(pass.program);
                gl.bindFramebuffer(gl.FRAMEBUFFER, pass.frameBuffer);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                for (const [key, uniform] of Object.entries(pass.uniforms)) {
                    const methods: { [index: string]: any } = {
                        f: gl.uniform1f,
                        // v2: gl.uniform2fv,
                        v3: gl.uniform3fv,
                        // v4: gl.uniform4fv,
                        // t: gl.uniform1i,
                    }

                    const textureUnitIds: { [index: string]: number } = {
                        iPrevPass: 0,
                        iBeforeBloom: 1,
                        iPairBloomDown: 2,
                        iTextTexture: 3,
                    }

                    if (uniform.type === "t") {
                        gl.activeTexture(gl.TEXTURE0 + textureUnitIds[key]);

                        if (key === "iTextTexture") {
                            gl.bindTexture(gl.TEXTURE_2D, textTexture);
                        } else if (!PRODUCTION && this.debugFrameNumber >= 0 && key === "iPrevPass" && pass.type === PassType.FinalImage) {
                            // NOTE: 特定パスを強制表示するためのデバッグ用の処理です
                            if (this.debugFrameNumber == 30) {
                                gl.bindTexture(gl.TEXTURE_2D, textTexture);
                            } else {
                                const i = Math.min(Math.floor(this.debugFrameNumber), imagePasses.length - 1);
                                gl.bindTexture(gl.TEXTURE_2D, imagePasses[i].texture);
                            }
                        } else {
                            gl.bindTexture(gl.TEXTURE_2D, imagePasses[uniform.value].texture);
                        }

                        // methods[uniform.type].call(gl, pass.locations[key], textureUnitIds[key]);
                        gl.uniform1i(pass.locations[key], textureUnitIds[key]);
                    } else {
                        methods[uniform.type].call(gl, pass.locations[key], uniform.value);
                    }
                };

                // draw the buffer with VAO
                // NOTE: binding vert and index buffer is not required
                gl.bindVertexArray(vertexArray);
                const indexOffset = 0 * index[0].length;
                gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, indexOffset);
                const error = gl.getError();
                if (error !== gl.NO_ERROR) console.log(error);
                gl.bindVertexArray(null);
                gl.useProgram(null);
            };

            this.setSize = (width: number, height: number) => {
                const canvas = gl.canvas;
                canvas.width = width;
                canvas.height = height;

                gl.viewport(0, 0, width, height);

                imagePasses.forEach(pass => {
                    gl.deleteFramebuffer(pass.frameBuffer);
                    gl.deleteTexture(pass.texture);
                    pass.uniforms.iResolution.value = [width * pass.scale, height * pass.scale, 0];
                    setupFrameBuffer(pass);
                });
            };

            this.playSound = () => {
                if (!PRODUCTION) {
                    const newAudioSource = this.audioContext.createBufferSource();
                    newAudioSource.buffer = this.audioSource.buffer;
                    newAudioSource.loop = this.audioSource.loop;
                    newAudioSource.connect(this.audioContext.destination);
                    this.audioSource = newAudioSource;
                }

                this.audioSource.start(this.audioContext.currentTime, this.time % this.timeLength);
            };

            if (!PRODUCTION) {
                this.stopSound = () => {
                    this.audioSource.stop();
                }
            }

            const initSound = () => {
                const sampleLength = Math.ceil(audio.sampleRate * timeLength);
                const audioBuffer = audio.createBuffer(2, sampleLength, audio.sampleRate);
                const samples = SOUND_WIDTH * SOUND_HEIGHT;
                const numBlocks = sampleLength / samples;

                let startTime, endTime;

                if (!PRODUCTION) {
                    startTime = performance.now();
                }

                const soundProgram = loadProgram(soundShader);

                if (!PRODUCTION) {
                    endTime = performance.now();
                    console.log(`compile soundShader: ${endTime - startTime} ms`);
                }

                const soundPass = initPass(soundProgram, 0, PassType.Sound, 1);
                for (let i = 0; i < numBlocks; i++) {
                    // update uniform & render
                    soundPass.uniforms.iBlockOffset.value = i * samples / audio.sampleRate;
                    renderPass(soundPass);

                    // read pixels
                    const pixels = new Uint8Array(SOUND_WIDTH * SOUND_HEIGHT * 4);
                    gl.readPixels(0, 0, SOUND_WIDTH, SOUND_HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

                    // convert pixels to samples
                    const outputDataL = audioBuffer.getChannelData(0);
                    const outputDataR = audioBuffer.getChannelData(1);
                    for (let j = 0; j < samples; j++) {
                        outputDataL[i * samples + j] = (pixels[j * 4 + 0] + 256 * pixels[j * 4 + 1]) / 65535 * 2 - 1;
                        outputDataR[i * samples + j] = (pixels[j * 4 + 2] + 256 * pixels[j * 4 + 3]) / 65535 * 2 - 1;
                    }
                }

                this.audioSource = audio.createBufferSource();

                if (PLAY_SOUND_FILE) {
                    (async () => {
                        const response = await fetch(PLAY_SOUND_FILE);
                        const arrayBuffer = await response.arrayBuffer();
                        this.audioSource.buffer = await audio.decodeAudioData(arrayBuffer);
                    })();
                } else {
                    this.audioSource.buffer = audioBuffer;
                }

                // this.audioSource.loop = false;
                this.audioSource.connect(audio.destination);
            };

            this.render = () => {
                imagePasses.forEach((pass) => {
                    pass.uniforms.iTime.value = this.time;
                    if (GLOBAL_UNIFORMS) {
                        for (const [key, value] of Object.entries(this.uniforms)) {
                            if (pass.uniforms[key] !== undefined) {
                                if (typeof value === "number") {
                                    pass.uniforms[key].value = value;
                                } else {
                                    // NOTE: for dat.GUI addColor
                                    pass.uniforms[key].value = [value[0] / 255, value[1] / 255, value[2] / 255];
                                }
                            }
                        };
                    }
                    renderPass(pass);
                });
            };

            // get global uniforms
            if (GLOBAL_UNIFORMS) {
                let currentGroup = "default";
                const getGlobalUniforms = (fragmentShader: string) => {
                    let reg = /uniform (float|vec3) (g.+);\s*(\/\/ ([\-\d\.-]+))?( ([\-\d\.]+) ([\-\d\.]+))?( [\w\d]+)?/g;
                    let result: RegExpExecArray;
                    while ((result = reg.exec(fragmentShader)) !== null) {
                        let uniform: { key: string, initValue: any, min?: number, max?: number, group?: string };

                        if (result[1] === "float") {
                            uniform = {
                                key: result[2],
                                initValue: result[4] !== undefined ? parseFloat(result[4]) : 0,
                            };

                            // get min / max for Debug dat.GUI
                            if (!PRODUCTION) {
                                uniform.min = result[6] !== undefined ? parseFloat(result[6]) : 0;
                                uniform.max = result[7] !== undefined ? parseFloat(result[7]) : 1;
                            }
                        } else {
                            uniform = {
                                key: result[2],
                                initValue: [parseFloat(result[4]), parseFloat(result[6]), parseFloat(result[7])],
                            };
                        }

                        if (!PRODUCTION) {
                            if (result[8] !== undefined) {
                                currentGroup = result[8];
                            }

                            uniform.group = currentGroup;
                        }

                        this.uniformArray.push(uniform);
                        this.uniforms[uniform.key] = uniform.initValue;
                    }
                };

                getGlobalUniforms(imageCommonHeaderShader);

                imageShaders.forEach(shader => {
                    getGlobalUniforms(shader);
                });

                getGlobalUniforms(bloomPrefilterShader);
                getGlobalUniforms(bloomDownsampleShader);
                getGlobalUniforms(bloomUpsampleShader);
                getGlobalUniforms(bloomFinalShader);
            }

            // create rendering pipeline
            const imagePasses: Pass[] = [];
            let passIndex = 0;
            imageShaders.forEach((shader, i, ary) => {
                if (i === bloomPassBeginIndex) {
                    imagePasses.push(initPass(
                        loadProgram(imageCommonHeaderShader + bloomPrefilterShader),
                        passIndex,
                        PassType.Bloom,
                        1
                    ));
                    passIndex++;

                    let scale = 1;
                    for (let j = 0; j < bloomDonwsampleIterations; j++) {
                        scale *= 0.5;
                        imagePasses.push(initPass(
                            loadProgram(imageCommonHeaderShader + bloomDownsampleShader),
                            passIndex,
                            PassType.Bloom,
                            scale,
                        ));
                        passIndex++;
                    }

                    for (let j = 0; j < bloomDonwsampleIterations - 1; j++) {
                        scale *= 2;
                        imagePasses.push(initPass(
                            loadProgram(imageCommonHeaderShader + bloomUpsampleShader),
                            passIndex,
                            PassType.BloomUpsample,
                            scale,
                        ));
                        passIndex++;
                    }

                    imagePasses.push(initPass(
                        loadProgram(imageCommonHeaderShader + bloomFinalShader),
                        passIndex,
                        PassType.BloomUpsample,
                        1,
                    ));
                    passIndex++;
                }

                let startTime, endTime;

                if (!PRODUCTION) {
                    startTime = performance.now();
                }

                imagePasses.push(initPass(
                    loadProgram(imageCommonHeaderShader + shader),
                    passIndex,
                    i < ary.length - 1 ? PassType.Image : PassType.FinalImage,
                    1
                ));

                if (!PRODUCTION) {
                    endTime = performance.now();
                    console.log(`compile imageShader[${i}]: ${endTime - startTime} ms`);
                }

                passIndex++;
            });

            initSound();

            // rendering loop
            let lastTimestamp = 0;
            let startTimestamp: number | null = null;
            const update = (timestamp: number) => {
                requestAnimationFrame(update);
                if (!startTimestamp) {
                    startTimestamp = timestamp;
                }

                const timeDelta = (timestamp - lastTimestamp) * 0.001;

                if (!PRODUCTION) {
                    if (this.onUpdate != null) {
                        this.onUpdate();
                    }
                }

                if (this.isPlaying || this.needsUpdate) {
                    if (this.onRender != null) {
                        this.onRender(this.time, timeDelta);
                    }

                    this.render();

                    if (PRODUCTION) {
                        this.time = (timestamp - startTimestamp) * 0.001;
                    } else {
                        if (this.isPlaying) {
                            this.time += timeDelta;
                        }
                    }
                }

                this.needsUpdate = false;
                lastTimestamp = timestamp;
            };

            this.play = () => {
                requestAnimationFrame(update);
            };
        }
    }
}