> [!NOTE]
> Development on this project is currently paused. If enough interest is shown, development will resume.

# 🌍 mc-mapper

Generate high-quality, top-down 2D maps from Minecraft Java Edition worlds.

## Features

- **Blazing Fast**: Utilizes a worker-thread pool to fully leverage all available CPU threads for parallel region processing.
- **High-Quality Rendering**: Implements advanced visual features for a rich and detailed map.
  - Smooth biome color blending
  - Realistic directional shading and ambient occlusion
  - Translucent water with a depth effect
  - Height-based tinting and saturation controls
- **Incremental Renders**: Only re-renders region files that have been changed or added, making map updates extremely fast.

## Planned Features and Improvements

- Dynamically import textures from an installed Minecraft client instead of the bundled ones.
- When watching a world, only render region files that have been changed on the surface.
- Integrate tilegen with the watch mode to automatically update the map tiles.
- More CLI options for configuration, easier than editing the config file.
- Render entities like mobs and players.

## Installation

### Source

Before installing, make sure you have [Bun](https://bun.sh/docs/installation) installed on your system.

```bash
git clone https://github.com/itsbrunodev/mc-mapper.git
cd mc-mapper
bun install
````

After installing, you must generate the texture cache before you can run the renderer.

```bash
bun precache
```

This command will extract necessary block textures and create a `texture_cache.json` file.

> [!NOTE] 
> For the time being, textures in the assets folder are from version 1.21.5, any new textures are not included. Dynamically imported textures are not yet supported.

## Usage

### CLI

mc-mapper can be used from the command-line with the following options:

| Option | Description | Required |
| --- | --- | --- |
| `<world_path>` | The path to the Minecraft world save you want to render. | Yes |
| `--incremental` | Only render new or updated region files. If omitted, a full re-render is performed. | No |

### Example usage

```bash
# Perform a full render of a world located in the "world" directory
bun start path/to/world/

# Perform an incremental update, only processing new region files
bun start path/to/world/ --incremental
```

This will process the region files and generate a final map at `./final_map.png`. Intermediate region images are stored in the `./out/` directory.

> [!NOTE]
> Some regions may be skipped if they are empty or have no renderable content.

## Configuration

All advanced rendering features can be toggled and configured by editing the `./constants/config.ts` file before running the application.

## How it works

- The main thread scans the Minecraft world's **region** directory and creates a queue of [.mca files](https://minecraft.wiki/w/Region_file_format) to process.
- It spawns a pool of worker threads (one per CPU thread) to handle the rendering tasks in parallel.
- Each worker receives a region file, parses the NBT data to find the highest solid block at each (X, Z) coordinate, and determines its color based on block type and biome.
- Advanced effects like shading, ambient occlusion, and biome blending are calculated and applied to the pixels.
- The worker generates a 512×512 PNG image for its assigned region.
- Once all workers are finished, a final stitcher process combines all the individual region images into a single, seamless final_map.png.

## Example Render

An example of the final map can be found at [example_final_map.png](./example_final_map.png). The generated image used the default config settings. The generation used a 1:3000 map from [Minecraft Earth Map](https://earth.motfe.net/) and took around 7 minutes to render with a Ryzen 5 5600x CPU (utilizing all 16 threads) and 32 GB of RAM.

## Assets Notice

All assets used in this project, including textures, are from the Minecraft Java Edition and are a property of Mojang.

## License

mc-mapper is under the [MIT](./LICENSE.md) license.
