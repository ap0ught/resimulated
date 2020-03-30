#version 300 es
precision highp float;
precision highp int;
precision mediump sampler3D;

void mainImage(out vec4 fragColor, in vec2 fragCoord);

out vec4 outColor;
void main(void) {
    vec4 c;
    mainImage(c, gl_FragCoord.xy);
    outColor = c;
}

// consts
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float PIH = 1.57079632679;

#define saturate(x) clamp(x, 0.0, 1.0)

uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iPrevPass;

// noise
// https://www.shadertoy.com/view/4djSRW
float hash11(float p) {
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// https://www.shadertoy.com/view/3tX3R4
float remap(float val, float im, float ix, float om, float ox) { return clamp(om + (val - im) * (ox - om) / (ix - im), om, ox); }

float remap01(float val, float im, float ix) { return remap(val, im, ix, 0.0, 1.0); }  // TODO: optimize

vec3 tap4(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec4 d = texelSize.xyxy * vec4(-1.0, -1.0, 1.0, 1.0);

    vec3 s;
    s = texture(tex, uv + d.xy).rgb;
    s += texture(tex, uv + d.zy).rgb;
    s += texture(tex, uv + d.xw).rgb;
    s += texture(tex, uv + d.zw).rgb;

    return s * (1.0 / 4.0);
}

#define BPM 140.0
#define beat (iTime * BPM / 60.0)
