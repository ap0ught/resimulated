/**
 * Linear interpolation between two values
 * 2つの値の間で線形補間を行います
 */
export const mix = (x: number, y: number, a: number) => x * (1 - a) + y * a;

/**
 * Clamp a value between min and max
 * 値をmin〜maxの範囲内に制限します
 */
export const clamp = (x: number, min: number, max: number) => x < min ? min : x > max ? max : x;

/**
 * Clamp with min/max order flexibility
 * min/maxの順序に関係なくクランプします
 */
export const clamp2 = (x: number, min: number, max: number) => min < max ? clamp(x, min, max) : clamp(x, max, min);

/**
 * Clamp value between 0 and 1
 * 値を0〜1の範囲に制限します
 */
export const saturate = (x: number) => clamp(x, 0, 1);

// Hologram Boxes by kaneta: https://www.shadertoy.com/view/3tX3R4
// 値の範囲を変換します (Remap values from one range to another)
/**
 * Remap a value from one range to another
 * 値をある範囲から別の範囲に再マップします
 * @param x Input value / 入力値
 * @param im Input minimum / 入力範囲の最小値
 * @param ix Input maximum / 入力範囲の最大値
 * @param om Output minimum / 出力範囲の最小値
 * @param ox Output maximum / 出力範囲の最大値
 */
export const remap = (x: number, im: number, ix: number, om: number, ox: number) => clamp2(om + (x - im) * (ox - om) / (ix - im), om, ox);

/**
 * Remap from arbitrary range to 0-1
 * 任意の範囲から0-1に再マップします
 */
export const remapFrom = (x: number, min: number, max: number) => remap(x, min, max, 0, 1);

/**
 * Remap from 0-1 to arbitrary range
 * 0-1から任意の範囲に再マップします
 */
export const remapTo = (x: number, min: number, max: number) => remap(x, 0, 1, min, max);

// Noise
// フラクタルブラウン運動ノイズ (Fractal Brownian Motion noise)
/**
 * Simple FBM noise function using sine waves
 * サイン波を使用したシンプルなFBMノイズ関数
 */
export const fbm = (x: number, t: number) => Math.sin(x + t) + 0.5 * Math.sin(2.0 * x + t) + 0.25 * Math.sin(4.0 * x + t);

// https://gist.github.com/gre/1650294
// イージング関数 (Easing functions)
/**
 * Cubic ease-in-out curve
 * 3次のイーズインアウト曲線
 */
export const easeInOutCubic = (t: number) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

/**
 * Velocity (derivative) of cubic ease-in-out
 * 3次イーズインアウトの速度（微分）
 */
export const easeInOutCubicVelocity = (t: number) => t < .5 ? 12 * t * t : 12 * (t - 1) * (t - 1);

/**
 * Cosine-based smooth transition
 * コサインベースのスムーズな遷移
 */
export const easeInOutCos = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/**
 * 3D Vector class for mathematical operations
 * 数学的操作のための3Dベクトルクラス
 */
export class Vector3 {
    constructor(
        public x: number,
        public y: number,
        public z: number
    ) {
    }

    /**
     * Add two vectors component-wise
     * 2つのベクトルの成分毎の加算
     */
    add(other: Vector3) {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    /**
     * Multiply two vectors component-wise
     * 2つのベクトルの成分毎の乗算
     */
    mul(other: Vector3) {
        return new Vector3(this.x * other.x, this.y * other.y, this.z * other.z);
    }

    /**
     * Scale vector by a scalar value
     * スカラー値でベクトルをスケールします
     */
    scale(scale: number) {
        return new Vector3(this.x * scale, this.y * scale, this.z * scale);
    }

    /**
     * Linear interpolation between two vectors
     * 2つのベクトル間の線形補間
     */
    static mix(v1: Vector3, v2: Vector3, a: number) {
        return new Vector3(mix(v1.x, v2.x, a), mix(v1.y, v2.y, a), mix(v1.z, v2.z, a));
    }

    /**
     * Generate 3D FBM noise vector
     * 3D FBMノイズベクトルを生成します
     */
    static fbm(t: number) {
        return new Vector3(fbm(11431, t), fbm(23123, t), fbm(87034, t));
    }
}