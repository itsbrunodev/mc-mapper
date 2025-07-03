import type { Color } from "@/lib/types";

export const CONFIG = {
	/**
	 * This setting controls the amount of color saturation that is applied to blocks in certain biomes.
	 *
	 * A higher value will result in more saturated colors, while a lower value will result in more desaturated colors.
	 *
	 * The default value is `1`.
	 */
	SATURATION_MULTIPLIER: 1,
	// --- Directional Shading ---
	/**
	 * Enables directional shading, which adds subtle shadows to the terrain based on the direction of the sun.
	 *
	 * The default value is `true`.
	 */
	ENABLE_DIRECTIONAL_SHADING: true,
	/**
	 * Controls the strength of the directional shading effect.
	 *
	 * The default value is `1.1`.
	 */
	SHADING_HIGHLIGHT_FACTOR: 1.1,
	/**
	 * Controls the strength of the shadow casting effect.
	 *
	 * The default value is `0.9`.
	 */
	SHADING_SHADOW_FACTOR: 0.9,
	// --- Water Depth Effect ---
	/**
	 * Enables the water depth effect, which adds a depth effect to the water.
	 *
	 * The default value is `true`.
	 */
	ENABLE_WATER_DEPTH_EFFECT: true,
	/**
	 * Controls the minimum depth of the water effect.
	 *
	 * The default value is `1`.
	 */
	SHALLOW_WATER_DEPTH: 1,
	/**
	 * Controls the maximum depth of the water effect at which the effect is fully applied.
	 *
	 * The default value is `18`.
	 */
	DEEP_WATER_DEPTH: 18,
	/**
	 * Controls the initial opacity of the water effect.
	 *
	 * The default value is `0.85`.
	 */
	MIN_WATER_OPACITY: 0.85,
	/**
	 * Controls the opacity curve factor of the water effect.
	 *
	 * `1` linear\
	 * `2` quadratic\
	 * `3` cubic
	 *
	 * The default value is `1`.
	 */
	WATER_OPACITY_CURVE_FACTOR: 1,
	// --- Biome Blending ---
	/**
	 * Enables biome blending, which adds subtle color blending between biomes.
	 *
	 * The default value is `true`.
	 * */
	ENABLE_BIOME_BLENDING: true,
	/**
	 * The radius (in blocks) to check for blending neighbors. A larger radius has a better gradient but slightly slower to calculate.
	 *
	 * The default value is `3`.
	 * */
	BIOME_BLEND_RADIUS: 3,
	// --- Ambient Occlusion ---
	/**
	 * Enables ambient occlusion, which adds subtle shadows in corners and crevices,
	 * giving the terrain a more three-dimensional appearance.
	 *
	 * The default value is `true`.
	 */
	ENABLE_AMBIENT_OCCLUSION: true,
	/**
	 * Controls the maximum darkness of the ambient occlusion effect. A value of `0.1` means that the most occluded areas will be `10%` darker.
	 *
	 * The default value is `0.1`.
	 */
	AMBIENT_OCCLUSION_STRENGTH: 0.1,
	/**
	 * The radius (in blocks) to check for occluding neighbors.
	 *
	 * The default value is `1`.
	 */
	AMBIENT_OCCLUSION_RADIUS: 1,
	// --- Height-Based Tinting ---
	/**
	 * Enables height-based color tinting. This can be used to create effects
	 * like a "snow-line" on mountains or atmospheric haze.
	 *
	 * The default value is `true`.
	 */
	ENABLE_HEIGHT_TINTING: true,
	/**
	 * The Y-level at which the height tinting effect begins.
	 *
	 * The default value is `128`.
	 */
	HEIGHT_TINT_START_Y: 128,
	/**
	 * The Y-level at which the height tinting effect reaches its maximum strength.
	 *
	 * The default value is `256`.
	 */
	HEIGHT_TINT_END_Y: 256,
	/**
	 * The color to tint the terrain with.
	 *
	 * The default value is `{ r: 255, g: 255, b: 255 }`.
	 */
	HEIGHT_TINT_COLOR: { r: 255, g: 255, b: 255 } as Color,
	/**
	 * The maximum strength of the tinting effect, where `1.0` would mean the
	 * original color is completely replaced by the tint color at `HEIGHT_TINT_END_Y`.
	 *
	 * The default value is `0.35` (a 35% blend).
	 */
	HEIGHT_TINT_STRENGTH: 0.35,
	// --- Watch Mode ---
	/**
	 * The number of seconds to wait after the last change to process.
	 *
	 * The default value is `30`.
	 */
	WATCH_DEBOUNCE_SECONDS: 30,
} as const;
