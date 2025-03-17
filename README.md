# MinecraftTS

A Minecraft clone built with TypeScript and Three.js.

## Features

- 3D voxel-based world rendering
- Procedural terrain generation using simplex noise
- Player movement with collision detection
- Dynamic chunk loading based on player position
- Basic block types (grass, dirt, stone, water, etc.)
- Simple tree generation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/MinecraftTS.git
cd MinecraftTS
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:9000`

## Controls

- WASD: Move around
- Space: Jump
- Shift: Move down (when flying)
- Mouse: Look around
- Click: Interact with the world (not implemented yet)

## Project Structure

- `src/core`: Core game engine components
- `src/world`: World generation and chunk management
- `src/player`: Player movement and physics
- `src/utils`: Utility functions

## Technologies Used

- TypeScript
- Three.js for 3D rendering
- simplex-noise for terrain generation
- webpack for bundling

## Future Improvements

- Block breaking and placement
- Inventory system
- More block types
- Better physics
- Multiplayer support
- Day/night cycle
- Mobs and animals

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Minecraft, created by Mojang Studios
- Built with Three.js and TypeScript 