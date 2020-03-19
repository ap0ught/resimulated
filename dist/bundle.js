!function(e){var n={};function t(o){if(n[o])return n[o].exports;var r=n[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,t),r.l=!0,r.exports}t.m=e,t.c=n,t.d=function(e,n,o){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:o})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(t.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var r in e)t.d(o,r,function(n){return e[n]}.bind(null,r));return o},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s=10)}([function(e,n,t){"use strict";t.r(n),n.default="#version 300 es\n\ninvariant gl_Position;\nin vec2 vert2d;\n\nvoid main(void) { gl_Position = vec4(vert2d, 0, 1); }\n"},function(e,n,t){"use strict";t.r(n),n.default="#version 300 es\nprecision highp float;\nprecision highp int;\nprecision mediump sampler3D;\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord);\n\nout vec4 outColor;\nvoid main(void) {\n    vec4 c;\n    mainImage(c, gl_FragCoord.xy);\n    outColor = c;\n}\n\n// consts\nconst float PI = 3.14159265359;\nconst float TAU = 6.28318530718;\nconst float PIH = 1.57079632679;\n\n#define saturate(x) clamp(x, 0.0, 1.0)\n\nuniform vec3 iResolution;\nuniform float iTime;\nuniform sampler2D iPrevPass;\n\nvec3 tap4(sampler2D tex, vec2 uv, vec2 texelSize) {\n    vec4 d = texelSize.xyxy * vec4(-1.0, -1.0, 1.0, 1.0);\n\n    vec3 s;\n    s = texture(tex, uv + d.xy).rgb;\n    s += texture(tex, uv + d.zy).rgb;\n    s += texture(tex, uv + d.xw).rgb;\n    s += texture(tex, uv + d.zw).rgb;\n\n    return s * (1.0 / 4.0);\n}\n\n#define BPM 140.0\n#define beat (iTime * BPM / 60.0)\n"},function(e,n,t){"use strict";t.r(n),n.default="// debug uniforms\nuniform float gCameraEyeX;     // 0 -100 100\nuniform float gCameraEyeY;     // 2.8 -100 100\nuniform float gCameraEyeZ;     // -8 -100 100\nuniform float gCameraTargetX;  // 0 -100 100\nuniform float gCameraTargetY;  // 2.75 -100 100\nuniform float gCameraTargetZ;  // 0 -100 100\nuniform float gCameraFov;      // 13 0 180\n\nuniform float gMandelboxScale;     // 2.7 1 5\nuniform float gMandelboxRepeat;    // 10 1 100\nuniform float gSceneEps;           // 0.001 0.00001 0.01\nuniform float gEdgeEps;            // 0.0005 0.0001 0.01\nuniform float gEdgePower;          // 1 0.1 10\nuniform float gBaseColor;          // 0.5\nuniform float gRoughness;          // 0.1\nuniform float gMetallic;           // 0.4\nuniform float gEmissiveIntensity;  // 6.0 0 20\n\n// consts\nconst float INF = 1e+10;\nconst float EPS = 0.01;\nconst float OFFSET = EPS * 10.0;\nconst float GROUND_BASE = 0.0;\n\n// ray\nstruct Ray {\n    vec3 origin;\n    vec3 direction;\n};\n\n// camera\nstruct Camera {\n    vec3 eye, target;\n    vec3 forward, right, up;\n};\n\nRay cameraShootRay(Camera c, vec2 uv) {\n    c.forward = normalize(c.target - c.eye);\n    c.right = normalize(cross(c.forward, c.up));\n    c.up = normalize(cross(c.right, c.forward));\n\n    Ray r;\n    r.origin = c.eye;\n    r.direction = normalize(uv.x * c.right + uv.y * c.up + c.forward / tan(gCameraFov / 360.0 * PI));\n\n    return r;\n}\n\n// intersection\nstruct Intersection {\n    bool hit;\n    vec3 position;\n    float distance;\n    vec3 normal;\n    vec2 uv;\n    float count;\n\n    vec3 baseColor;\n    float roughness;\n    float reflectance;\n    float metallic;\n    vec3 emission;\n\n    bool transparent;\n    float refractiveIndex;\n\n    vec3 color;\n};\n\n// util\n\n#define calcNormal(p, dFunc, eps)                                                                                                                                                 \\\n    normalize(vec2(eps, -eps).xyy *dFunc(p + vec2(eps, -eps).xyy) + vec2(eps, -eps).yyx * dFunc(p + vec2(eps, -eps).yyx) + vec2(eps, -eps).yxy * dFunc(p + vec2(eps, -eps).yxy) + \\\n              vec2(eps, -eps).xxx * dFunc(p + vec2(eps, -eps).xxx))\n\n// Distance Functions\nfloat sdBox(vec3 p, vec3 b) {\n    vec3 d = abs(p) - b;\n    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));\n}\n\nfloat dSphere(vec3 p, float r) { return length(p) - r; }\n\nmat2 rotate(float a) {\n    float c = cos(a), s = sin(a);\n    return mat2(c, s, -s, c);\n}\n\nfloat dMenger(vec3 z0, vec3 offset, float scale) {\n    vec4 z = vec4(z0, 1.0);\n    for (int n = 0; n < 5; n++) {\n        z = abs(z);\n\n        if (z.x < z.y) z.xy = z.yx;\n        if (z.x < z.z) z.xz = z.zx;\n        if (z.y < z.z) z.yz = z.zy;\n\n        z *= scale;\n        z.xyz -= offset * (scale - 1.0);\n\n        if (z.z < -0.5 * offset.z * (scale - 1.0)) {\n            z.z += offset.z * (scale - 1.0);\n        }\n    }\n    return length(max(abs(z.xyz) - vec3(1.0), 0.0)) / z.w;\n}\n\nfloat dMandelFast(vec3 p, float scale, int n) {\n    vec4 q0 = vec4(p, 1.0);\n    vec4 q = q0;\n\n    for (int i = 0; i < n; i++) {\n        // q.xz = mul(rotate(_MandelRotateXZ), q.xz);\n        q.xyz = clamp(q.xyz, -1.0, 1.0) * 2.0 - q.xyz;\n        q = q * scale / clamp(dot(q.xyz, q.xyz), 0.3, 1.0) + q0;\n    }\n\n    return length(q.xyz) / abs(q.w);\n}\n\nvec2 foldRotate(vec2 p, float s) {\n    float a = PI / s - atan(p.x, p.y);\n    float n = TAU / s;\n    a = floor(a / n) * n;\n    p = rotate(a) * p;\n    return p;\n}\n\nfloat dStage(vec3 p) { return dMandelFast(p, gMandelboxScale, int(gMandelboxRepeat)); }\n\nuniform float gDistortion;      // 0.01 0 0.1\nuniform float gDistortionFreq;  // 30 0 100\nfloat dBall(vec3 p) { return dSphere(p - vec3(0, 0, -10), 0.1) - gDistortion * sin(gDistortionFreq * p.x + beat) * sin(gDistortionFreq * p.y + beat) * sin(gDistortionFreq * p.z + beat); }\n\nvec3 opRep(vec3 p, vec3 c) { return mod(p, c) - 0.5 * c; }\n\nfloat map(vec3 p) {\n    float d = dStage(p);\n    d = min(d, dBall(p));\n    return d;\n}\n\n// color functions\nvec3 hsv2rgb(vec3 c) {\n    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n    return c.z * mix(K.xxx, saturate(p - K.xxx), c.y);\n}\n\n// https://www.shadertoy.com/view/lttGDn\nfloat calcEdge(vec3 p) {\n    float edge = 0.0;\n    vec2 e = vec2(gEdgeEps, 0);\n\n    // Take some distance function measurements from either side of the hit\n    // point on all three axes.\n    float d1 = map(p + e.xyy), d2 = map(p - e.xyy);\n    float d3 = map(p + e.yxy), d4 = map(p - e.yxy);\n    float d5 = map(p + e.yyx), d6 = map(p - e.yyx);\n    float d = map(p) * 2.;  // The hit point itself - Doubled to cut down on\n                            // calculations. See below.\n\n    // Edges - Take a geometry measurement from either side of the hit point.\n    // Average them, then see how much the value differs from the hit point\n    // itself. Do this for X, Y and Z directions. Here, the sum is used for the\n    // overall difference, but there are other ways. Note that it's mainly sharp\n    // surface curves that register a discernible difference.\n    edge = abs(d1 + d2 - d) + abs(d3 + d4 - d) + abs(d5 + d6 - d);\n    // edge = max(max(abs(d1 + d2 - d), abs(d3 + d4 - d)), abs(d5 + d6 - d)); //\n    // Etc.\n\n    // Once you have an edge value, it needs to normalized, and smoothed if\n    // possible. How you do that is up to you. This is what I came up with for\n    // now, but I might tweak it later.\n    edge = smoothstep(0., 1., sqrt(edge / e.x * 2.));\n\n    // Return the normal.\n    // Standard, normalized gradient mearsurement.\n    return edge;\n}\n\nuniform vec3 gEmissiveColor;  // 48 255 48\n\nvoid intersectObjects(inout Intersection intersection, inout Ray ray) {\n    float d;\n    float distance = 0.0;\n    vec3 p = ray.origin;\n    float eps;\n\n    for (float i = 0.0; i < 300.0; i++) {\n        d = abs(map(p));\n        distance += d;\n        p = ray.origin + distance * ray.direction;\n        intersection.count = i;\n        eps = gSceneEps * distance;\n        if (abs(d) < eps) break;\n    }\n\n    if (distance < intersection.distance) {\n        intersection.distance = distance;\n        intersection.hit = true;\n        intersection.position = p;\n        intersection.normal = calcNormal(p, map, gSceneEps);\n\n        if (abs(dBall(p)) < eps) {\n            intersection.baseColor = vec3(0.0);\n            intersection.roughness = 0.0;\n            intersection.metallic = 1.0;\n            intersection.emission = vec3(0.0);\n            intersection.transparent = false;\n            intersection.refractiveIndex = 1.2;\n            intersection.reflectance = 1.0;\n        } else {\n            intersection.baseColor = vec3(gBaseColor);\n            intersection.roughness = gRoughness;\n            intersection.metallic = gMetallic;\n\n            float edge = calcEdge(p);\n            intersection.emission = gEmissiveIntensity * gEmissiveColor * pow(edge, gEdgePower) * saturate(cos(beat * TAU - mod(0.5 * intersection.position.z, TAU)));\n\n            intersection.transparent = false;\n            intersection.reflectance = 0.0;\n        }\n    }\n}\n\nvoid intersectScene(inout Intersection intersection, inout Ray ray) {\n    intersection.distance = INF;\n    intersectObjects(intersection, ray);\n}\n\nfloat calcAo(in vec3 p, in vec3 n) {\n    float k = 1.0, occ = 0.0;\n    for (int i = 0; i < 5; i++) {\n        float len = 0.15 + float(i) * 0.15;\n        float distance = map(n * len + p);\n        occ += (len - distance) * k;\n        k *= 0.5;\n    }\n    return saturate(1.0 - occ);\n}\n\nfloat calcShadow(in vec3 p, in vec3 rd) {\n    float d;\n    float distance = OFFSET;\n    float bright = 1.0;\n    float shadowIntensity = 0.8;\n    float shadowSharpness = 10.0;\n\n    for (int i = 0; i < 30; i++) {\n        d = map(p + rd * distance);\n        if (d < EPS) return shadowIntensity;\n        bright = min(bright, shadowSharpness * d / distance);\n        distance += d;\n    }\n\n    return shadowIntensity + (1.0 - shadowIntensity) * bright;\n}\n\n#define FLT_EPS 5.960464478e-8\n\nfloat roughnessToExponent(float roughness) { return clamp(2.0 * (1.0 / (roughness * roughness)) - 2.0, FLT_EPS, 1.0 / FLT_EPS); }\n\nuniform float gF0;  // 0.95 0 1\nfloat fresnelSchlick(float f0, float cosTheta) { return f0 + (1.0 - f0) * pow((1.0 - cosTheta), 5.0); }\n\nvec3 evalPointLight(inout Intersection i, vec3 v, vec3 lp, vec3 radiance) {\n    vec3 n = i.normal;\n    vec3 p = i.position;\n    vec3 ref = mix(vec3(0.04), i.baseColor, i.metallic);\n\n    vec3 l = lp - p;\n    float len = length(l);\n    l /= len;\n\n    vec3 h = normalize(l + v);\n\n    vec3 diffuse = mix(1.0 - ref, vec3(0.0), i.metallic) * i.baseColor / PI;\n    // ref *= fresnelSchlick(gF0, dot(l, h));\n\n    float m = roughnessToExponent(i.roughness);\n    vec3 specular = ref * pow(max(0.0, dot(n, h)), m) * (m + 2.0) / (8.0 * PI);\n    return (diffuse + specular) * radiance * max(0.0, dot(l, n)) / (len * len);\n}\n\nvec3 evalDirectionalLight(inout Intersection i, vec3 v, vec3 lightDir, vec3 radiance) {\n    vec3 n = i.normal;\n    vec3 p = i.position;\n    vec3 ref = mix(vec3(0.04), i.baseColor, i.metallic);\n\n    vec3 l = lightDir;\n    vec3 h = normalize(l + v);\n\n    vec3 diffuse = mix(1.0 - ref, vec3(0.0), i.metallic) * i.baseColor / PI;\n    // ref *= fresnelSchlick(gF0, dot(l, h));\n\n    float m = roughnessToExponent(i.roughness);\n    vec3 specular = ref * pow(max(0.0, dot(n, h)), m) * (m + 2.0) / (8.0 * PI);\n    return (diffuse + specular) * radiance * max(0.0, dot(l, n));\n}\n\nuniform float gCameraLightIntensity;  // 1 0 10\n\nvoid calcRadiance(inout Intersection intersection, inout Ray ray) {\n    intersection.hit = false;\n    intersectScene(intersection, ray);\n\n    if (intersection.hit) {\n        intersection.color = intersection.emission;\n        intersection.color += evalPointLight(intersection, -ray.direction, vec3(gCameraEyeX, gCameraEyeY, gCameraEyeZ), gCameraLightIntensity * vec3(80.0, 80.0, 100.0));\n        // intersection.color += evalPointLight(intersection, -ray.direction, vec3(gCameraEyeX, gCameraEyeY, gCameraEyeZ + 4.0), vec3(0.0));\n        intersection.color += evalDirectionalLight(intersection, -ray.direction, vec3(-0.48666426339228763, 0.8111071056538127, 0.3244428422615251), vec3(2.0, 1.0, 1.0));\n\n        // fog\n        // intersection.color = mix(intersection.color, vec3(0.6),\n        //                         1.0 - exp(-0.0001 * intersection.distance *\n        //                         intersection.distance *\n        //                         intersection.distance));\n    } else {\n        intersection.color = vec3(0.01);\n    }\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);\n\n    // camera and ray\n    Camera camera;\n    camera.eye = vec3(gCameraEyeX, gCameraEyeY, gCameraEyeZ);\n    camera.target = vec3(gCameraTargetX, gCameraTargetY, gCameraTargetZ);\n    camera.up = vec3(0.0, 1.0, 0.0);  // y-up\n    Ray ray = cameraShootRay(camera, uv);\n\n    vec3 color = vec3(0.0);\n    vec3 reflection = vec3(1.0);\n    Intersection intersection;\n\n    for (int bounce = 0; bounce < 2; bounce++) {\n        calcRadiance(intersection, ray);\n        color += reflection * intersection.color;\n        if (!intersection.hit) break;\n        reflection *= intersection.reflectance;\n\n        bool isIncoming = dot(ray.direction, intersection.normal) < 0.0;\n        vec3 orientingNormal = isIncoming ? intersection.normal : -intersection.normal;\n\n        bool isTotalReflection = false;\n        if (intersection.transparent) {\n            float nnt = isIncoming ? 1.0 / intersection.refractiveIndex : intersection.refractiveIndex;\n            ray.origin = intersection.position - orientingNormal * OFFSET;\n            ray.direction = refract(ray.direction, orientingNormal, nnt);\n            isTotalReflection = (ray.direction == vec3(0.0));\n            bounce = 0;\n        }\n\n        if (isTotalReflection || !intersection.transparent) {\n            ray.origin = intersection.position + orientingNormal * OFFSET;\n            vec3 l = reflect(ray.direction, orientingNormal);\n            reflection *= fresnelSchlick(gF0, dot(l, orientingNormal));\n            ray.direction = l;\n        }\n    }\n\n    fragColor = vec4(color, 1.0);\n}"},function(e,n,t){"use strict";t.r(n),n.default="vec3 acesFilm(const vec3 x) {\n    const float a = 2.51;\n    const float b = 0.03;\n    const float c = 2.43;\n    const float d = 0.59;\n    const float e = 0.14;\n    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);\n}\n\nuniform float gTonemapExposure;  // 0.1 0.0 2\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec3 col = texture(iPrevPass, uv).rgb;\n    col = acesFilm(col * gTonemapExposure);\n    col = pow(col, vec3(1.0 / 2.2));\n    fragColor = vec4(col, 1.0);\n}"},function(e,n,t){"use strict";t.r(n),n.default="float brightness(vec3 c) { return max(max(c.r, c.g), c.b); }\n\nuniform float gBloomThreshold;  // 1.0 0 100\nuniform float gBloomSoftKnee;   // 0.5 0 4\n\n// https://github.com/Unity-Technologies/PostProcessing/blob/v1/PostProcessing/Runtime/Components/BloomComponent.cs#L78-L109\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    float softKnee = gBloomSoftKnee;\n    float lthresh = gBloomThreshold;\n\n    vec2 uv = fragCoord.xy / iResolution.xy;\n    vec4 color = texture(iPrevPass, uv);\n    vec3 m = color.rgb;\n    float br = brightness(m);\n\n    float knee = lthresh * softKnee + 1e-5f;\n    vec3 curve = vec3(lthresh - knee, knee * 2.0, 0.25 / knee);\n    float rq = clamp(br - curve.x, 0.0, curve.y);\n    rq = curve.z * rq * rq;\n\n    m *= max(rq, br - lthresh) / max(br, 1e-5);\n    fragColor = vec4(m, color.a);\n}"},function(e,n,t){"use strict";t.r(n),n.default="void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord.xy / iResolution.xy;\n    vec2 texelSize = 1.0 / iResolution.xy;\n    fragColor = vec4(tap4(iPrevPass, uv, texelSize), 1.0);\n}"},function(e,n,t){"use strict";t.r(n),n.default="uniform sampler2D iBeforeBloom;\nuniform sampler2D iPairBloomDown;\n\nuniform float gBloomSpread;  // 1.3 1 2\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord.xy / iResolution.xy;\n    vec2 texelSize = 1.0 / iResolution.xy;\n    vec3 col = texture(iPairBloomDown, uv).rgb;\n    fragColor = vec4(col + gBloomSpread * tap4(iPrevPass, uv, texelSize), 1.0);\n}"},function(e,n,t){"use strict";t.r(n),n.default="uniform sampler2D iBeforeBloom;\nuniform sampler2D iPairBloomDown;\n\nuniform float gBloomIntensity;  // 1 0 100\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord.xy / iResolution.xy;\n    vec2 texelSize = 1.0 / iResolution.xy;\n    vec3 col = texture(iBeforeBloom, uv).rgb;\n    vec3 pair = texture(iPairBloomDown, uv).rgb;\n    fragColor = vec4(col + gBloomIntensity * tap4(iPrevPass, uv, texelSize), 1.0);\n}"},function(e,n,t){"use strict";t.r(n),n.default="#version 300 es\nprecision mediump float;\nuniform float iSampleRate;\nuniform float iBlockOffset;\n\nvec2 mainSound(float time);\n\nout vec4 outColor;\nvoid main() {\n    float t = iBlockOffset + ((gl_FragCoord.x - 0.5) + (gl_FragCoord.y - 0.5) * 512.0) / iSampleRate;\n    vec2 y = mainSound(t);\n    vec2 v = floor((0.5 + 0.5 * y) * 65536.0);\n    vec2 vl = mod(v, 256.0) / 255.0;\n    vec2 vh = floor(v / 256.0) / 255.0;\n    outColor = vec4(vl.x, vh.x, vl.y, vh.y);\n}\n\n//--------------------\n// ここから下を書き換える\n//--------------------\n\n#define BPM 140.0\n\n#define PI 3.141592654\n#define TAU 6.283185307\n\n// ------\n// general functions\n\nfloat timeToBeat(float t) { return t / 60.0 * BPM; }\nfloat beatToTime(float b) { return b / BPM * 60.0; }\n\nfloat noteToFreq(float n) { return 440.0 * pow(2.0, (n - 69.0) / 12.0); }\n\nfloat chord(float n) { return n < 1.0 ? 55.0 : n < 2.0 ? 58.0 : n < 3.0 ? 62.0 : 65.0; }\n\n// https://www.shadertoy.com/view/4djSRW\nvec4 noise(float p) {\n    vec4 p4 = fract(vec4(p) * vec4(.1031, .1030, .0973, .1099));\n    p4 += dot(p4, p4.wzxy + 33.33);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\n// ------\n// primitive oscillators\n\nfloat sine(float phase) { return sin(TAU * phase); }\n\nfloat saw(float phase) { return 2.0 * fract(phase) - 1.0; }\n\nfloat square(float phase) { return fract(phase) < 0.5 ? -1.0 : 1.0; }\n\n// ------\n// drums\n\nfloat kick(float time) {\n    float amp = exp(-5.0 * time);\n    float phase = 50.0 * time - 10.0 * exp(-70.0 * time);\n    return amp * sine(phase);\n}\n\nvec2 hihat(float time) {\n    float amp = exp(-50.0 * time);\n    return amp * noise(time * 100.0).xy;\n}\n\n// ------\n// synths\n\nvec2 bass(float note, float time) {\n    float freq = noteToFreq(note);\n    return vec2(square(freq * time) + sine(freq * time)) / 2.0;\n}\n\nvec2 pad(float note, float time) {\n    float freq = noteToFreq(note);\n    float vib = 0.2 * sine(3.0 * time);\n    return vec2(saw(freq * 0.99 * time + vib), saw(freq * 1.01 * time + vib));\n}\n\nvec2 arp(float note, float time) {\n    float freq = noteToFreq(note);\n    float fmamp = 0.1 * exp(-50.0 * time);\n    float fm = fmamp * sine(time * freq * 7.0);\n    float amp = exp(-20.0 * time);\n    return amp * vec2(sine(freq * 0.99 * time + fm), sine(freq * 1.01 * time + fm));\n}\n\n// ------\n// main\n\nvec2 mainSound(float time) {\n    float beat = timeToBeat(time);\n    vec2 ret = vec2(0.0);\n\n    // ---\n    // kick\n\n    float kickTime = beatToTime(mod(beat, 1.0));\n    ret += 0.8 * kick(kickTime);\n\n    float sidechain = smoothstep(0.0, 0.4, kickTime);\n\n    // ---\n    // hihat\n\n    float hihatTime = beatToTime(mod(beat + 0.5, 1.0));\n    ret += 0.5 * hihat(hihatTime);\n\n    // ---\n    // bass\n\n    float bassNote = chord(0.0) - 24.0;\n    ret += sidechain * 0.6 * bass(bassNote, time);\n\n    // ---\n    // chord\n\n    ret += sidechain * 0.6 * vec2(pad(chord(0.0), time) + pad(chord(1.0), time) + pad(chord(2.0), time) + pad(chord(3.0), time)) / 4.0;\n\n    // ---\n    // arp\n\n    float arpTime = beatToTime(mod(beat, 0.25));\n    float[8] arpNotes = float[](69.0, 70.0, 71.0, 72.0, 69.0, 70.0, 69.0, 72.0);\n    float arpNote = arpNotes[int(mod(beat, 8.0))];\n\n    ret += sidechain * 0.5 * vec2(arp(arpNote, arpTime));\n\n    // ---\n\n    return clamp(ret, -1.0, 1.0);\n}"},function(e,n,t){"use strict";t.r(n),n.default="body{background-color:#000;margin:0;padding:0;color:#fff}canvas{display:block;position:absolute;top:0;left:0;right:0;bottom:0;margin:auto}#c{display:none}p{font-size:100px}"},function(e,n,t){"use strict";t.r(n);var o=0,r=1,i=2,a=3,c=4,s=function(){},l=function(e,n,t,l,f,u,m,d,v,p,g){var h=this;this.play=function(){h.timeLength=e,h.isPlaying=!0,h.needsUpdate=!1,h.time=0,h.uniformArray=[],h.uniforms={};var y=h.audioContext=new window.AudioContext,x=h.canvas=document.createElement("canvas");x.width=window.innerWidth,x.height=window.innerHeight,window.document.body.appendChild(x);var b=x.getContext("webgl2",{preserveDrawingBuffer:!0});if(b)if(b.getExtension("EXT_color_buffer_float"))if(b.getExtension("OES_texture_float_linear")){b.enable(b.CULL_FACE);var E=[[1,1],[-1,1],[1,-1],[-1,-1]],T=new Float32Array([].concat.apply([],E)),R=b.createBuffer();b.bindBuffer(b.ARRAY_BUFFER,R),b.bufferData(b.ARRAY_BUFFER,T,b.STATIC_DRAW),b.bindBuffer(b.ARRAY_BUFFER,null);var C=[[0,1,2],[3,2,1]],w=new Uint16Array([].concat.apply([],C)),F=b.createBuffer();b.bindBuffer(b.ELEMENT_ARRAY_BUFFER,F),b.bufferData(b.ELEMENT_ARRAY_BUFFER,w,b.STATIC_DRAW),b.bindBuffer(b.ELEMENT_ARRAY_BUFFER,null);var S=b.createVertexArray(),z=t.split("\n").length,P=function(e,n){var t=b.createShader(n);if(b.shaderSource(t,e),b.compileShader(t),!b.getShaderParameter(t,b.COMPILE_STATUS)){var o=b.getShaderInfoLog(t).replace(/(\d+):(\d+)/g,(function(e,n,t){var o=parseInt(t);return o<=z?n+":"+o+" (common header)":n+":"+(o-z)}));console.log(e,o)}return t},B=function(e){var t=[P(n,b.VERTEX_SHADER),P(e,b.FRAGMENT_SHADER)],o=b.createProgram();return t.forEach((function(e){return b.attachShader(o,e)})),b.linkProgram(o),b.getProgramParameter(o,b.LINK_STATUS)||console.log(b.getProgramInfoLog(o)),o},_=function(e,n,t,o){!function(e){b.bindVertexArray(S),b.bindBuffer(b.ARRAY_BUFFER,R),b.bindBuffer(b.ELEMENT_ARRAY_BUFFER,F);var n=b.getAttribLocation(e,"vert2d"),t=b.FLOAT,o=E[0].length,r=o*Float32Array.BYTES_PER_ELEMENT;b.enableVertexAttribArray(n),b.vertexAttribPointer(n,o,t,!1,r,0),b.bindVertexArray(null)}(e);var i=new s;if(i.program=e,i.index=n,i.type=t,i.scale=o,i.uniforms={iResolution:{type:"v3",value:[x.width*i.scale,x.height*i.scale,0]},iTime:{type:"f",value:0},iPrevPass:{type:"t",value:Math.max(i.index-1,0)},iBeforeBloom:{type:"t",value:Math.max(f-1,0)},iBlockOffset:{type:"f",value:0},iSampleRate:{type:"f",value:y.sampleRate}},t===a){var l=n-(f+u);i.uniforms.iPairBloomDown={type:"t",value:n-2*l}}return h.uniformArray.forEach((function(e){i.uniforms[e.key]={type:"number"==typeof e.initValue?"f":"v3",value:e.initValue}})),i.locations=function(e){var n={};return Object.keys(e.uniforms).forEach((function(t){n[t]=b.getUniformLocation(e.program,t)})),n}(i),function(e){if(e.type!==r){var n=e.uniforms.iResolution.value[0],t=e.uniforms.iResolution.value[1],o=b.FLOAT,i=b.RGBA32F,a=b.LINEAR;e.type===c&&(n=512,t=512,o=b.UNSIGNED_BYTE,i=b.RGBA,a=b.NEAREST),e.frameBuffer=b.createFramebuffer(),b.bindFramebuffer(b.FRAMEBUFFER,e.frameBuffer),e.texture=b.createTexture(),b.bindTexture(b.TEXTURE_2D,e.texture),b.texImage2D(b.TEXTURE_2D,0,i,n,t,0,b.RGBA,o,null),b.texParameteri(b.TEXTURE_2D,b.TEXTURE_MAG_FILTER,a),b.texParameteri(b.TEXTURE_2D,b.TEXTURE_MIN_FILTER,a),b.texParameteri(b.TEXTURE_2D,b.TEXTURE_WRAP_S,b.CLAMP_TO_EDGE),b.texParameteri(b.TEXTURE_2D,b.TEXTURE_WRAP_T,b.CLAMP_TO_EDGE),b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,e.texture,0),b.bindTexture(b.TEXTURE_2D,null),b.bindRenderbuffer(b.RENDERBUFFER,null),b.bindFramebuffer(b.FRAMEBUFFER,null)}}(i),i},A=function(e){b.useProgram(e.program),b.bindFramebuffer(b.FRAMEBUFFER,e.frameBuffer),b.clear(b.COLOR_BUFFER_BIT|b.DEPTH_BUFFER_BIT);for(var n=0,t=Object.entries(e.uniforms);n<t.length;n++){var o=t[n],r=o[0],i=o[1],a={f:b.uniform1f,v3:b.uniform3fv},c={iPrevPass:0,iBeforeBloom:1,iPairBloomDown:2};"t"===i.type?(b.activeTexture(b.TEXTURE0+c[r]),b.bindTexture(b.TEXTURE_2D,D[i.value].texture),b.uniform1i(e.locations[r],c[r])):a[i.type].call(b,e.locations[r],i.value)}b.bindVertexArray(S);var s=0*C[0].length;b.drawElements(b.TRIANGLES,w.length,b.UNSIGNED_SHORT,s);var l=b.getError();l!==b.NO_ERROR&&console.log(l),b.bindVertexArray(null),b.useProgram(null)};h.playSound=function(){h.audioSource.start(h.audioContext.currentTime,h.time%h.timeLength)},h.render=function(){D.forEach((function(e){e.uniforms.iTime.value=h.time;for(var n=0,t=Object.entries(h.uniforms);n<t.length;n++){var o=t[n],r=o[0],i=o[1];e.uniforms[r].value="number"==typeof i?i:[i[0]/255,i[1]/255,i[2]/255]}A(e)}))};var I=function(e){for(var n,t=/uniform (float|vec3) (g.+);\s*(\/\/ ([\-\d\.-]+))?( ([\-\d\.]+) ([\-\d\.]+))?/g;null!==(n=t.exec(e));){var o=void 0;o="float"===n[1]?{key:n[2],initValue:void 0!==n[4]?parseFloat(n[4]):0,min:void 0!==n[6]?parseFloat(n[6]):0,max:void 0!==n[7]?parseFloat(n[7]):1}:{key:n[2],initValue:[parseFloat(n[4]),parseFloat(n[6]),parseFloat(n[7])]},h.uniformArray.push(o),h.uniforms[o.key]=o.initValue}};I(t),l.forEach((function(e){I(e)})),I(m),I(d),I(v),I(p);var D=[],U=0;l.forEach((function(e,n,c){if(n===f){D.push(_(B(t+m),U,i,1)),U++;for(var s=1,l=0;l<u;l++)s*=.5,D.push(_(B(t+d),U,i,s)),U++;for(l=0;l<u-1;l++)s*=2,D.push(_(B(t+v),U,a,s)),U++;D.push(_(B(t+p),U,a,1)),U++}D.push(_(B(t+e),U,n<c.length-1?o:r,1)),U++})),function(){for(var n=y.createBuffer(2,y.sampleRate*e,y.sampleRate),t=y.sampleRate*e/262144,o=B(g),r=_(o,0,c,1),i=0;i<t;i++){r.uniforms.iBlockOffset.value=262144*i/y.sampleRate,A(r);var a=new Uint8Array(1048576);b.readPixels(0,0,512,512,b.RGBA,b.UNSIGNED_BYTE,a);for(var s=n.getChannelData(0),l=n.getChannelData(1),f=0;f<262144;f++)s[262144*i+f]=(a[4*f+0]+256*a[4*f+1])/65535*2-1,l[262144*i+f]=(a[4*f+2]+256*a[4*f+3])/65535*2-1}h.audioSource=y.createBufferSource(),h.audioSource.buffer=n,h.audioSource.loop=!0,h.audioSource.connect(y.destination)}();var M=0,k=function(e){requestAnimationFrame(k);var n=.001*(e-M);(h.isPlaying||h.needsUpdate)&&(null!=h.onRender&&h.onRender(h.time,n),h.render(),h.isPlaying&&(h.time+=n)),h.needsUpdate=!1,M=e};k(0)}else alert("need OES_texture_float_linear");else alert("need EXT_color_buffer_float");else console.log("WebGL 2 is not supported...")}},f=function(e,n,t){return e*(1-t)+n*t},u=function(e,n){return Math.sin(e+n)+.5*Math.sin(2*e+n)+.25*Math.sin(4*e+n)},m=function(){function e(e,n,t){this.x=e,this.y=n,this.z=t}return e.prototype.add=function(n){return new e(this.x+n.x,this.y+n.y,this.z+n.z)},e.prototype.mul=function(n){return new e(this.x*n.x,this.y*n.y,this.z*n.z)},e.prototype.scale=function(n){return new e(this.x*n,this.y*n,this.z*n)},e.mix=function(n,t,o){return new e(f(n.x,t.x,o),f(n.y,t.y,o),f(n.z,t.z,o))},e.fbm=function(n){return new e(u(11431,n),u(23123,n),u(87034,n))},e}(),d=new l(48,t(0).default,t(1).default,[t(2).default,t(3).default],1,5,t(4).default,t(5).default,t(6).default,t(7).default,t(8).default),v=function(){function e(e){this.input=e,this.begin=0,this.done=!1}return e.prototype.then=function(e,n){return this.done||this.input<this.begin?this:this.input>this.begin+e?(this.begin+=e,this):(n(this.input-this.begin),this.done=!0,this)},e}();window.addEventListener("load",(function(e){var n=document.createElement("style");n.innerText=t(9).default,document.head.appendChild(n);var o=document.createElement("p");document.body.appendChild(o),o.innerHTML="click me!",o.onclick=function(){document.body.requestFullscreen().then((function(){d.onRender=function(e,n){!function(e,n){var t=140*e/60,o=new m(0,0,10),r=new m(0,0,0);d.uniformArray.forEach((function(e){d.uniforms[e.key]=e.initValue})),new v(t).then(8,(function(e){o=new m(0,.2,-13-.1*e).add(m.fbm(e).scale(.01)),r=new m(0,0,0),d.uniforms.gMandelboxScale=1.8,d.uniforms.gCameraLightIntensity=.7,d.uniforms.gEmissiveIntensity=0,d.uniforms.gSceneEps=.003})).then(8,(function(e){o=new m(0,.2,-17-.1*e).add(m.fbm(e).scale(.01)),r=new m(0,0,0),d.uniforms.gMandelboxScale=1.8,d.uniforms.gCameraLightIntensity=1.2,d.uniforms.gEmissiveIntensity=0})).then(16,(function(e){o=new m(-.08503080276580499,1.3346599987007965,-15.01732922836809).add(m.fbm(e).scale(.01)),r=new m(.784904810273659,3.3444920877098543,7.36034431847018),d.uniforms.gCameraFov=2+.1*e,d.uniforms.gMandelboxScale=2.5010184112784057,d.uniforms.gCameraLightIntensity=1.4,d.uniforms.gEmissiveIntensity=0,d.uniforms.gSceneEps=.0002645177773046626})).then(16,(function(e){var n=new m(0,2.8,-8),t=new m(0,0,-32);o=m.mix(n,t,function(e,n,t){return e<n?n:e>t?t:e}(.1*e,0,1)),r=new m(0,0,0),d.uniforms.gMandelboxScale=1+.02*e,d.uniforms.gEmissiveIntensity=6})).then(1600,(function(e){o=new m(0,0,25).add(m.fbm(e).scale(.01)),r=new m(0,0,0),d.uniforms.gMandelboxScale=1,d.uniforms.gEmissiveIntensity=6})),d.uniforms.gCameraEyeX=o.x,d.uniforms.gCameraEyeY=o.y,d.uniforms.gCameraEyeZ=o.z,d.uniforms.gCameraTargetX=r.x,d.uniforms.gCameraTargetY=r.y,d.uniforms.gCameraTargetZ=r.z}(e)},d.play(),d.playSound()}))}}),!1)}]);