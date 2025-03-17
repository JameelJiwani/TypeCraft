import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk';
import { Block, BlockType } from './Block';
import { createTextureAtlas } from '../utils/TextureLoader';

// Constants
const RENDER_DISTANCE = 5; // Number of chunks to render in each direction
const WATER_LEVEL = 60; // Water level in the world

export class World {
    private scene: THREE.Scene;
    private chunks: Map<string, Chunk> = new Map();
    private textureAtlas: THREE.Texture;
    private noise2D: ReturnType<typeof createNoise2D>;
    private loadedChunks: Set<string> = new Set();

    constructor(scene: THREE.Scene) {
        console.log('World constructor called');
        this.scene = scene;
        
        // Initialize noise generator
        console.log('Initializing noise generator...');
        try {
            this.noise2D = createNoise2D();
            console.log('Noise generator initialized');
        } catch (error) {
            console.error('Error initializing noise generator:', error);
            throw error;
        }
        
        // Create texture atlas
        console.log('Creating texture atlas...');
        try {
            this.textureAtlas = createTextureAtlas();
            console.log('Texture atlas created');
        } catch (error) {
            console.error('Error creating texture atlas:', error);
            throw error;
        }
    }

    generateTerrain(): void {
        console.log('World.generateTerrain() called');
        // Generate chunks around origin
        for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
            for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
                console.log(`Generating chunk at (${x}, ${z})...`);
                this.generateChunk(x, z);
            }
        }
        console.log('Terrain generation completed');
    }

    update(playerPosition: THREE.Vector3): void {
        // Calculate player's chunk coordinates
        const playerChunkX = Math.floor(playerPosition.x / CHUNK_SIZE);
        const playerChunkZ = Math.floor(playerPosition.z / CHUNK_SIZE);
        
        // Generate or load chunks within render distance
        for (let x = playerChunkX - RENDER_DISTANCE; x <= playerChunkX + RENDER_DISTANCE; x++) {
            for (let z = playerChunkZ - RENDER_DISTANCE; z <= playerChunkZ + RENDER_DISTANCE; z++) {
                const chunkKey = `${x},${z}`;
                
                // If chunk is not loaded, generate it
                if (!this.loadedChunks.has(chunkKey)) {
                    this.generateChunk(x, z);
                    this.loadedChunks.add(chunkKey);
                }
            }
        }
        
        // Unload chunks that are too far away
        for (const chunkKey of this.loadedChunks) {
            const [x, z] = chunkKey.split(',').map(Number);
            
            if (
                x < playerChunkX - RENDER_DISTANCE - 1 ||
                x > playerChunkX + RENDER_DISTANCE + 1 ||
                z < playerChunkZ - RENDER_DISTANCE - 1 ||
                z > playerChunkZ + RENDER_DISTANCE + 1
            ) {
                // Unload chunk
                const chunk = this.chunks.get(chunkKey);
                if (chunk) {
                    const mesh = chunk.getMesh();
                    if (mesh) {
                        this.scene.remove(mesh);
                    }
                    chunk.dispose();
                    this.chunks.delete(chunkKey);
                    this.loadedChunks.delete(chunkKey);
                }
            }
        }
    }

    private generateChunk(chunkX: number, chunkZ: number): void {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Check if chunk already exists
        if (this.chunks.has(chunkKey)) {
            return;
        }
        
        // Create new chunk
        const chunk = new Chunk(chunkX, chunkZ, this.textureAtlas);
        
        // Generate terrain for the chunk
        this.generateChunkTerrain(chunk, chunkX, chunkZ);
        
        // Build mesh and add to scene
        const mesh = chunk.buildMesh();
        this.scene.add(mesh);
        
        // Store chunk
        this.chunks.set(chunkKey, chunk);
    }

    private generateChunkTerrain(chunk: Chunk, chunkX: number, chunkZ: number): void {
        // Generate heightmap for the chunk
        const heightMap: number[][] = [];
        
        for (let x = 0; x < CHUNK_SIZE; x++) {
            heightMap[x] = [];
            for (let z = 0; z < CHUNK_SIZE; z++) {
                // Calculate world coordinates
                const worldX = chunkX * CHUNK_SIZE + x;
                const worldZ = chunkZ * CHUNK_SIZE + z;
                
                // Generate height using multiple octaves of noise
                let height = this.generateHeight(worldX, worldZ);
                
                // Clamp height to valid range
                height = Math.max(1, Math.min(CHUNK_HEIGHT - 1, height));
                
                heightMap[x][z] = height;
            }
        }
        
        // Fill chunk with blocks based on heightmap
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const height = heightMap[x][z];
                
                // Bedrock layer
                chunk.setBlock(x, 0, z, BlockType.BEDROCK);
                
                // Stone layer
                for (let y = 1; y < height - 4; y++) {
                    chunk.setBlock(x, y, z, BlockType.STONE);
                }
                
                // Dirt layer
                for (let y = height - 4; y < height; y++) {
                    chunk.setBlock(x, y, z, BlockType.DIRT);
                }
                
                // Top layer (grass or sand)
                if (height <= WATER_LEVEL + 2) {
                    // Sand near water
                    chunk.setBlock(x, height, z, BlockType.SAND);
                } else {
                    // Grass elsewhere
                    chunk.setBlock(x, height, z, BlockType.GRASS);
                }
                
                // Water
                if (height < WATER_LEVEL) {
                    for (let y = height + 1; y <= WATER_LEVEL; y++) {
                        chunk.setBlock(x, y, z, BlockType.WATER);
                    }
                }
                
                // Generate trees (simple version)
                if (
                    height > WATER_LEVEL + 3 && // Above water level
                    height < CHUNK_HEIGHT - 10 && // Not too high
                    Math.random() < 0.01 && // 1% chance
                    x > 2 && x < CHUNK_SIZE - 3 && // Not too close to chunk edge
                    z > 2 && z < CHUNK_SIZE - 3
                ) {
                    this.generateTree(chunk, x, height + 1, z);
                }
            }
        }
    }

    private generateHeight(x: number, z: number): number {
        // Scale coordinates for noise
        const scale1 = 0.01;
        const scale2 = 0.05;
        const scale3 = 0.002;
        
        // Generate multiple layers of noise
        const baseHeight = 60;
        
        // Large-scale terrain features
        const mountainNoise = this.noise2D(x * scale3, z * scale3);
        const mountains = Math.pow(Math.max(0, mountainNoise), 2) * 60;
        
        // Medium-scale terrain features
        const hillsNoise = this.noise2D(x * scale1, z * scale1);
        const hills = hillsNoise * 20;
        
        // Small-scale terrain features
        const detailNoise = this.noise2D(x * scale2, z * scale2);
        const details = detailNoise * 5;
        
        // Combine all layers
        return Math.floor(baseHeight + mountains + hills + details);
    }

    private generateTree(chunk: Chunk, x: number, y: number, z: number): void {
        // Tree trunk
        const trunkHeight = 4 + Math.floor(Math.random() * 3); // 4-6 blocks tall
        
        for (let i = 0; i < trunkHeight; i++) {
            chunk.setBlock(x, y + i, z, BlockType.WOOD);
        }
        
        // Tree leaves
        const leavesHeight = 3;
        const leavesRadius = 2;
        
        for (let ly = 0; ly < leavesHeight; ly++) {
            const y1 = y + trunkHeight - 1 + ly;
            for (let lx = -leavesRadius; lx <= leavesRadius; lx++) {
                for (let lz = -leavesRadius; lz <= leavesRadius; lz++) {
                    // Skip corners for a more rounded shape
                    if (Math.abs(lx) == leavesRadius && Math.abs(lz) == leavesRadius) {
                        continue;
                    }
                    
                    // Make top layer smaller
                    if (ly == leavesHeight - 1 && (Math.abs(lx) > 1 || Math.abs(lz) > 1)) {
                        continue;
                    }
                    
                    // Calculate block position
                    const bx = x + lx;
                    const bz = z + lz;
                    
                    // Skip if outside chunk
                    if (bx < 0 || bx >= CHUNK_SIZE || bz < 0 || bz >= CHUNK_SIZE) {
                        continue;
                    }
                    
                    // Don't overwrite trunk
                    if (lx == 0 && lz == 0 && ly < leavesHeight - 1) {
                        continue;
                    }
                    
                    // Set leaf block
                    chunk.setBlock(bx, y1, bz, BlockType.LEAVES);
                }
            }
        }
    }

    getBlock(x: number, y: number, z: number): Block | null {
        // Calculate chunk coordinates
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        
        // Calculate local coordinates within chunk
        const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        
        // Get chunk
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(chunkKey);
        
        if (!chunk) {
            return null;
        }
        
        // Get block from chunk
        return chunk.getBlock(localX, y, localZ);
    }

    setBlock(x: number, y: number, z: number, type: BlockType): void {
        // Calculate chunk coordinates
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        
        // Calculate local coordinates within chunk
        const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        
        // Get chunk
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(chunkKey);
        
        if (!chunk) {
            return;
        }
        
        // Set block in chunk
        chunk.setBlock(localX, y, localZ, type);
        
        // Rebuild chunk mesh
        const mesh = chunk.buildMesh();
        
        // Update neighboring chunks if block is on the edge
        if (localX === 0) {
            this.updateChunkMesh(chunkX - 1, chunkZ);
        } else if (localX === CHUNK_SIZE - 1) {
            this.updateChunkMesh(chunkX + 1, chunkZ);
        }
        
        if (localZ === 0) {
            this.updateChunkMesh(chunkX, chunkZ - 1);
        } else if (localZ === CHUNK_SIZE - 1) {
            this.updateChunkMesh(chunkX, chunkZ + 1);
        }
    }

    private updateChunkMesh(chunkX: number, chunkZ: number): void {
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(chunkKey);
        
        if (chunk) {
            chunk.buildMesh();
        }
    }
} 