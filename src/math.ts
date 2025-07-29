/**
 * Linear interpolation between two values.
 * This is a fundamental graphics programming function that blends two values
 * smoothly based on an alpha parameter.
 * 
 * @param x - The first value (returned when a = 0)
 * @param y - The second value (returned when a = 1)  
 * @param a - The interpolation factor between 0 and 1
 * @returns The interpolated value between x and y
 */
export const mix = (x: number, y: number, a: number) => x * (1 - a) + y * a;

/**
 * Constrains a value to lie within a specified range.
 * This prevents values from going outside expected bounds,
 * which is essential for preventing visual artifacts in graphics.
 * 
 * @param x - The value to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The clamped value within [min, max]
 */
export const clamp = (x: number, min: number, max: number) => x < min ? min : x > max ? max : x;

/**
 * Advanced clamp function that handles inverted min/max ranges.
 * This version automatically handles cases where min > max by
 * swapping the parameters internally.
 * 
 * @param x - The value to clamp
 * @param min - The first boundary value
 * @param max - The second boundary value
 * @returns The clamped value within the corrected range
 */
export const clamp2 = (x: number, min: number, max: number) => min < max ? clamp(x, min, max) : clamp(x, max, min);

/**
 * Clamps a value to the standard normalized range [0, 1].
 * This is commonly used in graphics programming to ensure
 * color values and other normalized parameters stay within bounds.
 * 
 * @param x - The value to saturate
 * @returns The value clamped to [0, 1]
 */
export const saturate = (x: number) => clamp(x, 0, 1);

/**
 * Remaps a value from one range to another with clamping.
 * This function is particularly useful for converting between different
 * coordinate systems or normalizing values to specific ranges.
 * Based on the "Hologram Boxes" shader by kaneta on Shadertoy.
 * Reference: https://www.shadertoy.com/view/3tX3R4
 * 
 * @param x - The input value to remap
 * @param im - Input minimum value
 * @param ix - Input maximum value  
 * @param om - Output minimum value
 * @param ox - Output maximum value
 * @returns The remapped value, clamped to the output range
 */
export const remap = (x: number, im: number, ix: number, om: number, ox: number) => clamp2(om + (x - im) * (ox - om) / (ix - im), om, ox);

/**
 * Remaps a value from an arbitrary range to the normalized range [0, 1].
 * This is commonly used to normalize input values for further processing.
 * 
 * @param x - The input value
 * @param min - The minimum of the input range
 * @param max - The maximum of the input range
 * @returns The normalized value in [0, 1]
 */
export const remapFrom = (x: number, min: number, max: number) => remap(x, min, max, 0, 1);

/**
 * Remaps a normalized value [0, 1] to an arbitrary range.
 * This is the inverse of remapFrom, useful for scaling normalized
 * values to specific output ranges.
 * 
 * @param x - The normalized input value [0, 1]
 * @param min - The minimum of the output range
 * @param max - The maximum of the output range
 * @returns The scaled value in [min, max]
 */
export const remapTo = (x: number, min: number, max: number) => remap(x, 0, 1, min, max);

/**
 * Fractional Brownian Motion (FBM) noise function.
 * This creates organic, natural-looking noise by combining multiple
 * sine waves at different frequencies and amplitudes. The technique
 * is widely used in procedural generation for textures, terrain, and animations.
 * 
 * @param x - The input coordinate/time value
 * @param t - The time parameter for animation
 * @returns A noise value combining multiple octaves of sine waves
 */
export const fbm = (x: number, t: number) => Math.sin(x + t) + 0.5 * Math.sin(2.0 * x + t) + 0.25 * Math.sin(4.0 * x + t);

/**
 * Cubic ease-in-out animation curve.
 * This creates smooth animations that start slowly, accelerate in the middle,
 * and slow down at the end. It's more visually pleasing than linear interpolation
 * and is commonly used in UI animations and transitions.
 * Reference: https://gist.github.com/gre/1650294
 * 
 * @param t - The time parameter, typically in range [0, 1]
 * @returns The eased value with smooth acceleration/deceleration
 */
export const easeInOutCubic = (t: number) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

/**
 * Velocity function for the cubic ease-in-out curve.
 * This represents the rate of change (derivative) of the easeInOutCubic function,
 * useful for physics simulations or when you need to know the speed of animation.
 * 
 * @param t - The time parameter, typically in range [0, 1]
 * @returns The velocity (rate of change) at time t
 */
export const easeInOutCubicVelocity = (t: number) => t < .5 ? 12 * t * t : 12 * (t - 1) * (t - 1);

/**
 * Cosine-based ease-in-out animation curve.
 * This creates a smooth S-curve transition using cosine interpolation.
 * It's often preferred for its mathematical simplicity and smooth derivatives.
 * 
 * @param t - The time parameter, typically in range [0, 1]
 * @returns The eased value using cosine interpolation
 */
export const easeInOutCos = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/**
 * A basic 3D vector class for graphics programming.
 * This class provides essential vector operations commonly needed
 * in 3D graphics, including basic arithmetic and utility functions.
 * While more advanced 3D libraries exist, this minimal implementation
 * keeps the bundle size small for the 64KB intro constraint.
 */
export class Vector3 {
    /**
     * Creates a new 3D vector with x, y, z components.
     * 
     * @param x - The X coordinate
     * @param y - The Y coordinate  
     * @param z - The Z coordinate
     */
    constructor(
        public x: number,
        public y: number,
        public z: number
    ) {
    }

    /**
     * Adds another vector to this vector component-wise.
     * This is vector addition: (a.x + b.x, a.y + b.y, a.z + b.z)
     * 
     * @param other - The vector to add
     * @returns A new Vector3 containing the sum
     */
    add(other: Vector3) {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    /**
     * Multiplies this vector by another vector component-wise.
     * This is element-wise multiplication, not dot or cross product.
     * Useful for scaling each axis independently.
     * 
     * @param other - The vector to multiply by
     * @returns A new Vector3 containing the component-wise product
     */
    mul(other: Vector3) {
        return new Vector3(this.x * other.x, this.y * other.y, this.z * other.z);
    }

    /**
     * Scales this vector by a uniform scalar value.
     * This multiplies all components by the same factor,
     * changing the vector's magnitude but not its direction.
     * 
     * @param scale - The scalar value to multiply by
     * @returns A new Vector3 scaled by the given factor
     */
    scale(scale: number) {
        return new Vector3(this.x * scale, this.y * scale, this.z * scale);
    }

    /**
     * Linear interpolation between two vectors.
     * This blends between two 3D positions smoothly, commonly used
     * for camera movements, object animations, and color transitions.
     * 
     * @param v1 - The first vector (returned when a = 0)
     * @param v2 - The second vector (returned when a = 1)
     * @param a - The interpolation factor between 0 and 1
     * @returns A new Vector3 interpolated between v1 and v2
     */
    static mix(v1: Vector3, v2: Vector3, a: number) {
        return new Vector3(mix(v1.x, v2.x, a), mix(v1.y, v2.y, a), mix(v1.z, v2.z, a));
    }

    /**
     * Generates a 3D noise vector using FBM (Fractional Brownian Motion).
     * This creates natural-looking 3D noise by applying the fbm function
     * to each component with different seed values. Useful for procedural
     * animations, particle effects, and organic movements.
     * 
     * @param t - The time parameter for animated noise
     * @returns A new Vector3 containing 3D noise values
     */
    static fbm(t: number) {
        return new Vector3(fbm(11431, t), fbm(23123, t), fbm(87034, t));
    }
}