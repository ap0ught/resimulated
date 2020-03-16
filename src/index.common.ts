import { Chromatic } from "./chromatic"
import { mix, clamp, saturate, Vector3 } from "./math"

// for Webpack DefinePlugin
declare var PRODUCTION: boolean;

export const chromatic = new Chromatic(
    48,// デモの長さ（秒）
    require("./shaders/vertex.glsl").default,
    require("./shaders/common-header.glsl").default,
    [
        //require("./shaders/kaleidoscope.glsl").default,
        require("./shaders/raymarching-mandelbox.glsl").default,
        require("./shaders/tone-mapping.glsl").default,

        //require("./shaders/kaleidoscope.glsl").default,
        //require("./shaders/invert.glsl").default,
        //require("./shaders/dot-matrix.glsl").default,
        //require("./shaders/chromatic-aberration.glsl").default,
    ],

    1,
    5,
    require("./shaders/bloom-prefilter.glsl").default,
    require("./shaders/bloom-downsample.glsl").default,
    require("./shaders/bloom-upsample.glsl").default,
    require("./shaders/bloom-final.glsl").default,

    require("./shaders/sound-template.glsl").default,
);

class Timeline {
    begin: number;
    done: boolean;

    constructor(public input: number) {
        this.begin = 0;
        this.done = false;
    }

    then(length: number, event: (offset: number) => void) {
        if (this.done || this.input < this.begin) {
            return this;
        }

        if (this.input > this.begin + length) {
            this.begin += length;
            return this;
        }

        event(this.input - this.begin);
        this.done = true;
        return this;
    }
}

export const animateUniforms = (time: number, debugCamera: boolean) => {
    const bpm = 140;
    const beat = time * bpm / 60;

    let camera = new Vector3(0, 0, 10);
    let target = new Vector3(0, 0, 0);

    new Timeline(beat).then(8, t => {
        camera = new Vector3(0, 0.2, -13.0 - t * 0.1).add(Vector3.fbm(t).scale(0.01));
        target = new Vector3(0, 0, 0);

        chromatic.globalUniformValues.gMandelboxScale = 1.8;
        chromatic.globalUniformValues.gCameraLightIntensity = 0.7;
        chromatic.globalUniformValues.gEmissiveIntensity = 0;
    }).then(8, t => {
        camera = new Vector3(0, 0.2, -17.0 - t * 0.1).add(Vector3.fbm(t).scale(0.01));
        target = new Vector3(0, 0, 0);

        chromatic.globalUniformValues.gMandelboxScale = 1.8;
        chromatic.globalUniformValues.gCameraLightIntensity = 1.2;
        chromatic.globalUniformValues.gEmissiveIntensity = 0;
    }).then(16, t => {
        const camera1 = new Vector3(0, 2.8, -8);
        const camera2 = new Vector3(0, 0, -32);

        camera = Vector3.mix(camera1, camera2, saturate(0.1 * t));
        target = new Vector3(0, 0, 0);

        chromatic.globalUniformValues.gMandelboxScale = 1.0 + 0.02 * t;
        chromatic.globalUniformValues.gEmissiveIntensity = 6;
    }).then(1600, t => {
        camera = new Vector3(0, 0, 25.0).add(Vector3.fbm(t).scale(0.01));
        target = new Vector3(0, 0, 0);
        chromatic.globalUniformValues.gMandelboxScale = 1.0;
        chromatic.globalUniformValues.gEmissiveIntensity = 6;
    });

    if (!PRODUCTION && debugCamera) {
        return;
    }

    chromatic.globalUniformValues.gCameraEyeX = camera.x;
    chromatic.globalUniformValues.gCameraEyeY = camera.y;
    chromatic.globalUniformValues.gCameraEyeZ = camera.z;
    chromatic.globalUniformValues.gCameraTargetX = target.x;
    chromatic.globalUniformValues.gCameraTargetY = target.y;
    chromatic.globalUniformValues.gCameraTargetZ = target.z;
}