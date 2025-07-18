import { processHexColorMap } from "@/lib/utils";

import type { Color } from "@/lib/types";

export const OVERRIDE_COLORS = processHexColorMap({
	"minecraft:snow": "#E5E5E5",
	"minecraft:snow_block": "#E5E5E5",
});

export const DECORATION_COLORS = processHexColorMap({
	"minecraft:poppy": "#ED2929",
	"minecraft:dandelion": "#FED94F",
	"minecraft:blue_orchid": "#6496FA",
	"minecraft:allium": "#B87DEB",
	"minecraft:azure_bluet": "#D9E1E8",
	"minecraft:red_tulip": "#BF3638",
	"minecraft:orange_tulip": "#D87F33",
	"minecraft:white_tulip": "#DBEAEF",
	"minecraft:pink_tulip": "#E48BBA",
	"minecraft:oxeye_daisy": "#D4D4D4",
	"minecraft:cornflower": "#485ABD",
	"minecraft:lily_of_the_valley": "#DEDEDE",
	"minecraft:wither_rose": "#232022",
	"minecraft:sunflower": "#FCD721",
	"minecraft:lilac": "#B682BE",
	"minecraft:rose_bush": "#932D2D",
	"minecraft:peony": "#D9A8B6",
	"minecraft:torchflower": "#E47625",
	"minecraft:sugar_cane": "#9CD687",
});

export const DECORATION_BLOCKS = new Set(Object.keys(DECORATION_COLORS));

export const FALLBACK_COLORS: Record<string, Color> = {
	default: { r: 255, g: 20, b: 147 },
};

export const BIOME_GRASS_COLORS = processHexColorMap({
	default: "#88A96D",
	"minecraft:badlands": "#A18E68",
	"minecraft:eroded_badlands": "#A18E68",
	"minecraft:wooded_badlands": "#A18E68",
	"minecraft:cherry_grove": "#AECF5E",
	"minecraft:desert": "#D1B27D",
	"minecraft:savanna": "#B5A062",
	"minecraft:savanna_plateau": "#B5A062",
	"minecraft:windswept_savanna": "#B5A062",
	"minecraft:stony_peaks": "#89947A",
	"minecraft:jungle": "#659A45",
	"minecraft:bamboo_jungle": "#659A45",
	"minecraft:sparse_jungle": "#72A858",
	"minecraft:mushroom_fields": "#52BE3C",
	"minecraft:swamp": "#686E37",
	"minecraft:mangrove_swamp": "#5C7258",
	"minecraft:plains": "#92A95C",
	"minecraft:sunflower_plains": "#92A95C",
	"minecraft:beach": "#92A95C",
	"minecraft:dripstone_caves": "#92A95C",
	"minecraft:forest": "#729656",
	"minecraft:flower_forest": "#729656",
	"minecraft:dark_forest": "#4E7530",
	"minecraft:birch_forest": "#84B563",
	"minecraft:old_growth_birch_forest": "#84B563",
	"minecraft:ocean": "#88A96D",
	"minecraft:deep_ocean": "#88A96D",
	"minecraft:warm_ocean": "#88A96D",
	"minecraft:lukewarm_ocean": "#88A96D",
	"minecraft:deep_lukewarm_ocean": "#88A96D",
	"minecraft:cold_ocean": "#88A96D",
	"minecraft:deep_cold_ocean": "#88A96D",
	"minecraft:deep_frozen_ocean": "#88A96D",
	"minecraft:river": "#88A96D",
	"minecraft:lush_caves": "#88A96D",
	"minecraft:meadow": "#78A164",
	"minecraft:old_growth_pine_taiga": "#74926B",
	"minecraft:taiga": "#74926B",
	"minecraft:old_growth_spruce_taiga": "#74926B",
	"minecraft:windswept_hills": "#7E8E78",
	"minecraft:windswept_gravelly_hills": "#7E8E78",
	"minecraft:windswept_forest": "#7E8E78",
	"minecraft:stony_shore": "#7E8E78",
	"minecraft:snowy_beach": "#7FAC8E",
	"minecraft:snowy_plains": "#7CB093",
	"minecraft:ice_spikes": "#7CB093",
	"minecraft:snowy_taiga": "#7CB093",
	"minecraft:frozen_ocean": "#7CB093",
	"minecraft:frozen_river": "#7CB093",
	"minecraft:grove": "#7CB093",
	"minecraft:snowy_slopes": "#7CB093",
	"minecraft:frozen_peaks": "#7CB093",
	"minecraft:jagged_peaks": "#7CB093",
});

export const BIOME_FOLIAGE_COLORS = processHexColorMap({
	default: "#6DA14A",
	"minecraft:badlands": "#958059",
	"minecraft:eroded_badlands": "#958059",
	"minecraft:wooded_badlands": "#958059",
	"minecraft:desert": "#B4A268",
	"minecraft:savanna": "#A08F57",
	"minecraft:savanna_plateau": "#A08F57",
	"minecraft:windswept_savanna": "#A08F57",
	"minecraft:stony_peaks": "#7A8265",
	"minecraft:jungle": "#508B28",
	"minecraft:bamboo_jungle": "#508B28",
	"minecraft:sparse_jungle": "#5F943D",
	"minecraft:mushroom_fields": "#29B50E",
	"minecraft:swamp": "#686E37",
	"minecraft:plains": "#7D9647",
	"minecraft:sunflower_plains": "#7D9647",
	"minecraft:beach": "#7D9647",
	"minecraft:dripstone_caves": "#7D9647",
	"minecraft:forest": "#668547",
	"minecraft:flower_forest": "#668547",
	"minecraft:dark_forest": "#487527",
	"minecraft:birch_forest": "#709650",
	"minecraft:old_growth_birch_forest": "#709650",
	"minecraft:ocean": "#6DA14A",
	"minecraft:deep_ocean": "#6DA14A",
	"minecraft:warm_ocean": "#6DA14A",
	"minecraft:lukewarm_ocean": "#6DA14A",
	"minecraft:deep_lukewarm_ocean": "#6DA14A",
	"minecraft:cold_ocean": "#6DA14A",
	"minecraft:deep_cold_ocean": "#6DA14A",
	"minecraft:deep_frozen_ocean": "#6DA14A",
	"minecraft:river": "#6DA14A",
	"minecraft:lush_caves": "#6DA14A",
	"minecraft:meadow": "#5FA345",
	"minecraft:old_growth_pine_taiga": "#649F5B",
	"minecraft:taiga": "#649E5F",
	"minecraft:old_growth_spruce_taiga": "#649E5F",
	"minecraft:windswept_hills": "#699D67",
	"minecraft:windswept_gravelly_hills": "#699D67",
	"minecraft:windswept_forest": "#699D67",
	"minecraft:stony_shore": "#699D67",
	"minecraft:snowy_beach": "#609C74",
	"minecraft:snowy_plains": "#5C9B77",
	"minecraft:ice_spikes": "#5C9B77",
	"minecraft:snowy_taiga": "#5C9B77",
	"minecraft:frozen_ocean": "#5C9B77",
	"minecraft:frozen_river": "#5C9B77",
	"minecraft:grove": "#5C9B77",
	"minecraft:snowy_slopes": "#5C9B77",
	"minecraft:frozen_peaks": "#5C9B77",
	"minecraft:jagged_peaks": "#5C9B77",
});

export const BIOME_WATER_COLORS = processHexColorMap({
	default: "#4371A6",
	"minecraft:badlands": "#4371A6",
	"minecraft:bamboo_jungle": "#4371A6",
	"minecraft:basalt_deltas": "#4371A6",
	"minecraft:beach": "#4371A6",
	"minecraft:birch_forest": "#4371A6",
	"minecraft:crimson_forest": "#4371A6",
	"minecraft:dark_forest": "#4371A6",
	"minecraft:deep_dark": "#4371A6",
	"minecraft:deep_ocean": "#4371A6",
	"minecraft:desert": "#4371A6",
	"minecraft:dripstone_caves": "#4371A6",
	"minecraft:end_barrens": "#4371A6",
	"minecraft:end_midlands": "#4371A6",
	"minecraft:eroded_badlands": "#4371A6",
	"minecraft:flower_forest": "#4371A6",
	"minecraft:forest": "#4371A6",
	"minecraft:frozen_peaks": "#4371A6",
	"minecraft:grove": "#4371A6",
	"minecraft:ice_spikes": "#4371A6",
	"minecraft:jagged_peaks": "#4371A6",
	"minecraft:jungle": "#4371A6",
	"minecraft:lush_caves": "#4371A6",
	"minecraft:mushroom_fields": "#4371A6",
	"minecraft:nether_wastes": "#4371A6",
	"minecraft:ocean": "#4371A6",
	"minecraft:old_growth_birch_forest": "#4371A6",
	"minecraft:old_growth_pine_taiga": "#4371A6",
	"minecraft:old_growth_spruce_taiga": "#4371A6",
	"minecraft:plains": "#4371A6",
	"minecraft:river": "#4371A6",
	"minecraft:savanna_plateau": "#4371A6",
	"minecraft:savanna": "#4371A6",
	"minecraft:small_end_islands": "#4371A6",
	"minecraft:snowy_plains": "#4371A6",
	"minecraft:snowy_slopes": "#4371A6",
	"minecraft:soul_sand_valley": "#4371A6",
	"minecraft:sparse_jungle": "#4371A6",
	"minecraft:stony_peaks": "#4371A6",
	"minecraft:stony_shore": "#4371A6",
	"minecraft:sunflower_plains": "#4371A6",
	"minecraft:taiga": "#4371A6",
	"minecraft:the_end": "#4371A6",
	"minecraft:the_void": "#4371A6",
	"minecraft:warped_forest": "#4371A6",
	"minecraft:windswept_forest": "#4371A6",
	"minecraft:windswept_gravelly_hills": "#4371A6",
	"minecraft:windswept_hills": "#4371A6",
	"minecraft:windswept_savanna": "#4371A6",
	"minecraft:wooded_badlands": "#4371A6",
	"minecraft:cold_ocean": "#3D6191",
	"minecraft:deep_cold_ocean": "#3D6191",
	"minecraft:snowy_taiga": "#3D6191",
	"minecraft:snowy_beach": "#3D6191",
	"minecraft:frozen_ocean": "#3A537A",
	"minecraft:deep_frozen_ocean": "#3A537A",
	"minecraft:frozen_river": "#3A537A",
	"minecraft:lukewarm_ocean": "#4A80B3",
	"minecraft:deep_lukewarm_ocean": "#4A80B3",
	"minecraft:swamp": "#55664A",
	"minecraft:warm_ocean": "#49A5D6",
	"minecraft:meadow": "#3C4E9C",
	"minecraft:mangrove_swamp": "#4E6659",
	"minecraft:cherry_grove": "#5DB7EF", // Kept vibrant as a special biome
});
