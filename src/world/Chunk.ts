import * as THREE from 'three';
import { Block, BlockType, blockTextureCoordinates } from './Block';

// Constants
export const CHUNK_SIZE = 16; // 16x16x16 blocks per chunk
export const CHUNK_HEIGHT = 128; // Maximum world height

export class Chunk {
    private blocks: (Block | null)[][][];
    private mesh: THREE.Mesh | null = null;
    private geometry: THREE.BufferGeometry | null = null;
    private material: THREE.MeshLambertMaterial;
    private chunkX: number;
    private chunkZ: number;
    private isDirty: boolean = true;
    private textureAtlas: THREE.Texture;

    constructor(chunkX: number, chunkZ: number, textureAtlas: THREE.Texture) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.textureAtlas = textureAtlas;
        
        // Initialize blocks array
        this.blocks = new Array(CHUNK_SIZE);
        for (let x = 0; x < CHUNK_SIZE; x++) {
            this.blocks[x] = new Array(CHUNK_HEIGHT);
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                this.blocks[x][y] = new Array(CHUNK_SIZE).fill(null);
            }
        }
        
        // Initialize material
        this.material = new THREE.MeshLambertMaterial({
            map: this.textureAtlas,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.FrontSide
        });
    }

    setBlock(x: number, y: number, z: number, type: BlockType): void {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return;
        }
        
        // Create a new block or update existing one
        if (type === BlockType.AIR) {
            this.blocks[x][y][z] = null;
        } else {
            this.blocks[x][y][z] = {
                type,
                x: this.chunkX * CHUNK_SIZE + x,
                y,
                z: this.chunkZ * CHUNK_SIZE + z
            };
        }
        
        // Mark chunk as dirty to rebuild mesh
        this.isDirty = true;
    }

    getBlock(x: number, y: number, z: number): Block | null {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return null;
        }
        
        return this.blocks[x][y][z];
    }

    buildMesh(): THREE.Mesh {
        // If mesh already exists and chunk is not dirty, return existing mesh
        if (this.mesh && !this.isDirty) {
            return this.mesh;
        }
        
        // Create new geometry
        if (this.geometry) {
            this.geometry.dispose();
        }
        this.geometry = new THREE.BufferGeometry();
        
        // Arrays to store vertex data
        const vertices: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        
        // Texture atlas settings
        const textureSize = 16; // Size of each texture in the atlas
        const atlasSize = 16; // Number of textures in each row/column of the atlas
        
        // Helper function to add a face
        const addFace = (
            x: number, y: number, z: number,
            face: 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back',
            block: Block
        ) => {
            const vertexOffset = vertices.length / 3;
            
            // Define vertices for each face
            if (face === 'top') {
                vertices.push(
                    x, y + 1, z,
                    x + 1, y + 1, z,
                    x + 1, y + 1, z + 1,
                    x, y + 1, z + 1
                );
                normals.push(
                    0, 1, 0,
                    0, 1, 0,
                    0, 1, 0,
                    0, 1, 0
                );
            } else if (face === 'bottom') {
                vertices.push(
                    x, y, z,
                    x, y, z + 1,
                    x + 1, y, z + 1,
                    x + 1, y, z
                );
                normals.push(
                    0, -1, 0,
                    0, -1, 0,
                    0, -1, 0,
                    0, -1, 0
                );
            } else if (face === 'left') {
                vertices.push(
                    x, y, z,
                    x, y + 1, z,
                    x, y + 1, z + 1,
                    x, y, z + 1
                );
                normals.push(
                    -1, 0, 0,
                    -1, 0, 0,
                    -1, 0, 0,
                    -1, 0, 0
                );
            } else if (face === 'right') {
                vertices.push(
                    x + 1, y, z,
                    x + 1, y, z + 1,
                    x + 1, y + 1, z + 1,
                    x + 1, y + 1, z
                );
                normals.push(
                    1, 0, 0,
                    1, 0, 0,
                    1, 0, 0,
                    1, 0, 0
                );
            } else if (face === 'front') {
                vertices.push(
                    x, y, z + 1,
                    x, y + 1, z + 1,
                    x + 1, y + 1, z + 1,
                    x + 1, y, z + 1
                );
                normals.push(
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1
                );
            } else if (face === 'back') {
                vertices.push(
                    x, y, z,
                    x + 1, y, z,
                    x + 1, y + 1, z,
                    x, y + 1, z
                );
                normals.push(
                    0, 0, -1,
                    0, 0, -1,
                    0, 0, -1,
                    0, 0, -1
                );
            }
            
            // Get texture coordinates for this face
            const texCoord = blockTextureCoordinates[block.type][face];
            const tx = texCoord[0] / atlasSize;
            const ty = texCoord[1] / atlasSize;
            const tileSize = 1 / atlasSize;
            
            // Add UVs for the face
            uvs.push(
                tx, ty,
                tx, ty + tileSize,
                tx + tileSize, ty + tileSize,
                tx + tileSize, ty
            );
            
            // Add indices for the face (two triangles)
            indices.push(
                vertexOffset, vertexOffset + 1, vertexOffset + 2,
                vertexOffset, vertexOffset + 2, vertexOffset + 3
            );
        };
        
        // Iterate through all blocks in the chunk
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const block = this.blocks[x][y][z];
                    
                    // Skip air blocks
                    if (!block || block.type === BlockType.AIR) {
                        continue;
                    }
                    
                    // Check each face of the block
                    // Only add faces that are adjacent to air or transparent blocks
                    
                    // Top face
                    if (y === CHUNK_HEIGHT - 1 || !this.blocks[x][y + 1][z] || this.blocks[x][y + 1][z]?.type === BlockType.AIR) {
                        addFace(x, y, z, 'top', block);
                    }
                    
                    // Bottom face
                    if (y === 0 || !this.blocks[x][y - 1][z] || this.blocks[x][y - 1][z]?.type === BlockType.AIR) {
                        addFace(x, y, z, 'bottom', block);
                    }
                    
                    // Left face (negative X)
                    if (x === 0 || !this.blocks[x - 1][y][z] || this.blocks[x - 1][y][z]?.type === BlockType.AIR) {
                        addFace(x, y, z, 'left', block);
                    }
                    
                    // Right face (positive X)
                    if (x === CHUNK_SIZE - 1 || !this.blocks[x + 1][y][z] || this.blocks[x + 1][y][z]?.type === BlockType.AIR) {
                        addFace(x, y, z, 'right', block);
                    }
                    
                    // Front face (positive Z)
                    if (z === CHUNK_SIZE - 1 || !this.blocks[x][y][z + 1] || this.blocks[x][y][z + 1]?.type === BlockType.AIR) {
                        addFace(x, y, z, 'front', block);
                    }
                    
                    // Back face (negative Z)
                    if (z === 0 || !this.blocks[x][y][z - 1] || this.blocks[x][y][z - 1]?.type === BlockType.AIR) {
                        addFace(x, y, z, 'back', block);
                    }
                }
            }
        }
        
        // Set geometry attributes
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        this.geometry.setIndex(indices);
        
        // Create or update mesh
        if (this.mesh) {
            this.mesh.geometry = this.geometry;
        } else {
            this.mesh = new THREE.Mesh(this.geometry, this.material);
            this.mesh.position.set(
                this.chunkX * CHUNK_SIZE,
                0,
                this.chunkZ * CHUNK_SIZE
            );
        }
        
        // Mark chunk as clean
        this.isDirty = false;
        
        return this.mesh;
    }

    getMesh(): THREE.Mesh | null {
        return this.mesh;
    }

    dispose(): void {
        if (this.geometry) {
            this.geometry.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
    }
} 