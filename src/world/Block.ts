export enum BlockType {
    AIR = 0,
    GRASS = 1,
    DIRT = 2,
    STONE = 3,
    BEDROCK = 4,
    WATER = 5,
    SAND = 6,
    WOOD = 7,
    LEAVES = 8
}

export interface Block {
    type: BlockType;
    x: number;
    y: number;
    z: number;
    // Add more properties as needed (e.g., durability, transparency, etc.)
}

export interface BlockFace {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    front: boolean;
    back: boolean;
}

// Block texture coordinates (UV mapping)
export const blockTextureCoordinates: Record<BlockType, { [key: string]: [number, number] }> = {
    [BlockType.AIR]: {
        top: [0, 0],
        bottom: [0, 0],
        left: [0, 0],
        right: [0, 0],
        front: [0, 0],
        back: [0, 0]
    },
    [BlockType.GRASS]: {
        top: [0, 0],    // Grass top
        bottom: [2, 0],  // Dirt
        left: [3, 0],    // Grass side
        right: [3, 0],
        front: [3, 0],
        back: [3, 0]
    },
    [BlockType.DIRT]: {
        top: [2, 0],
        bottom: [2, 0],
        left: [2, 0],
        right: [2, 0],
        front: [2, 0],
        back: [2, 0]
    },
    [BlockType.STONE]: {
        top: [1, 0],
        bottom: [1, 0],
        left: [1, 0],
        right: [1, 0],
        front: [1, 0],
        back: [1, 0]
    },
    [BlockType.BEDROCK]: {
        top: [1, 1],
        bottom: [1, 1],
        left: [1, 1],
        right: [1, 1],
        front: [1, 1],
        back: [1, 1]
    },
    [BlockType.WATER]: {
        top: [13, 12],
        bottom: [13, 12],
        left: [13, 12],
        right: [13, 12],
        front: [13, 12],
        back: [13, 12]
    },
    [BlockType.SAND]: {
        top: [2, 1],
        bottom: [2, 1],
        left: [2, 1],
        right: [2, 1],
        front: [2, 1],
        back: [2, 1]
    },
    [BlockType.WOOD]: {
        top: [5, 1],
        bottom: [5, 1],
        left: [4, 1],
        right: [4, 1],
        front: [4, 1],
        back: [4, 1]
    },
    [BlockType.LEAVES]: {
        top: [5, 3],
        bottom: [5, 3],
        left: [5, 3],
        right: [5, 3],
        front: [5, 3],
        back: [5, 3]
    }
}; 