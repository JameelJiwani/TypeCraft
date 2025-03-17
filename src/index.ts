import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

// Add debugging
console.log('MinecraftTS starting...');

// Define block types and materials
interface BlockMaterials {
    grass: THREE.Material;
    dirt: THREE.Material;
    stone: THREE.Material;
    sand: THREE.Material;
    water: THREE.Material;
    bedrock: THREE.Material;
    [key: string]: THREE.Material; // Index signature for string keys
}

interface Block {
    position: THREE.Vector3;
    material: THREE.Material;
    mesh?: THREE.Mesh; // Reference to the mesh for efficient removal
}

interface BlocksMap {
    [key: string]: Block;
}

interface Chunk {
    x: number;
    z: number;
    blocks: BlocksMap;
    isLoaded: boolean;
}

// Create a Minecraft-like world
function createMinecraftWorld() {
    console.log('Creating Minecraft world...');
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue color
    console.log('Scene created');
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 0);
    console.log('Camera created');
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    console.log('Renderer created and added to DOM');
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    scene.add(directionalLight);
    console.log('Lights added');
    
    // Create first-person controls
    const controls = new PointerLockControls(camera, document.body);
    console.log('Controls created');
    
    // Add instructions element
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '50%';
    instructions.style.left = '50%';
    instructions.style.transform = 'translate(-50%, -50%)';
    instructions.style.textAlign = 'center';
    instructions.style.color = 'white';
    instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    instructions.style.padding = '20px';
    instructions.style.borderRadius = '5px';
    instructions.style.fontFamily = 'Arial, sans-serif';
    instructions.innerHTML = `
        <h1>MinecraftTS</h1>
        <p>Click to play</p>
        <p>WASD = Move, SPACE = Jump, SHIFT = Lower</p>
        <p>F = Toggle flying mode</p>
        <p>Mouse = Look around</p>
        <p>ESC = Pause</p>
    `;
    document.body.appendChild(instructions);
    
    // Setup pointer lock
    instructions.addEventListener('click', () => {
        controls.lock();
    });
    
    controls.addEventListener('lock', () => {
        instructions.style.display = 'none';
    });
    
    controls.addEventListener('unlock', () => {
        instructions.style.display = 'block';
    });
    
    // Constants for chunk management
    const CHUNK_SIZE = 16; // Size of each chunk (16x16 blocks, like Minecraft)
    const RENDER_DISTANCE = 3; // Number of chunks to render in each direction
    const cubeSize = 1;
    const waterLevel = 3;
    
    // Create box geometry for blocks
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    
    // Create different materials for different types of blocks
    const materials: BlockMaterials = {
        grass: new THREE.MeshLambertMaterial({ color: 0x7FFF7F }), // Grass (green)
        dirt: new THREE.MeshLambertMaterial({ color: 0x8B4513 }), // Dirt (brown)
        stone: new THREE.MeshLambertMaterial({ color: 0x7F7F7F }), // Stone (gray)
        sand: new THREE.MeshLambertMaterial({ color: 0xC2B280 }), // Sand (tan)
        water: new THREE.MeshLambertMaterial({ 
            color: 0x0000FF, 
            transparent: true, 
            opacity: 0.6 
        }), // Water (blue)
        bedrock: new THREE.MeshLambertMaterial({ color: 0x000000 }), // Bedrock (black)
    };
    
    // Create a group to hold all chunks
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    
    // Store chunks in a map: "chunkX,chunkZ" -> Chunk
    const chunks: Map<string, Chunk> = new Map();
    
    // Debug info for UI
    const debugInfo = document.createElement('div');
    debugInfo.style.position = 'absolute';
    debugInfo.style.bottom = '10px';
    debugInfo.style.left = '10px';
    debugInfo.style.color = 'white';
    debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    debugInfo.style.padding = '5px';
    debugInfo.style.borderRadius = '3px';
    debugInfo.style.fontFamily = 'monospace';
    debugInfo.style.fontSize = '12px';
    document.body.appendChild(debugInfo);
    
    // Improved noise function with more natural terrain
    function noise(x: number, z: number): number {
        // Multiple frequencies for more natural terrain
        const amplitude1 = 8;
        const frequency1 = 0.01;
        const amplitude2 = 4;
        const frequency2 = 0.03;
        const amplitude3 = 2;
        const frequency3 = 0.07;
        
        // Use sin/cos combination for a simple but decent noise function
        const height1 = Math.sin(x * frequency1) * Math.cos(z * frequency1) * amplitude1;
        const height2 = Math.sin(x * frequency2 + 0.1) * Math.cos(z * frequency2) * amplitude2;
        const height3 = Math.sin(x * frequency3 + 0.2) * Math.cos(z * frequency3) * amplitude3;
        
        // Add some randomization to break up patterns
        const randomFactor = Math.sin(x * 0.1 + z * 0.1) * 0.5;
        
        return height1 + height2 + height3 + randomFactor;
    }
    
    // Function to generate a heightmap for a chunk
    function generateHeightMap(chunkX: number, chunkZ: number): number[][] {
        const heightMap: number[][] = [];
        
        for (let x = 0; x < CHUNK_SIZE; x++) {
            heightMap[x] = [];
            for (let z = 0; z < CHUNK_SIZE; z++) {
                // Calculate world coordinates
                const worldX = chunkX * CHUNK_SIZE + x;
                const worldZ = chunkZ * CHUNK_SIZE + z;
                
                // Generate height using noise function
                const baseHeight = 5;
                const noiseHeight = noise(worldX, worldZ);
                const height = Math.floor(baseHeight + noiseHeight);
                
                heightMap[x][z] = height;
            }
        }
        
        return heightMap;
    }
    
    // Function to generate a single chunk
    function generateChunk(chunkX: number, chunkZ: number): Chunk {
        // Create a new chunk object
        const chunk: Chunk = {
            x: chunkX,
            z: chunkZ,
            blocks: {},
            isLoaded: false
        };
        
        // Generate heightmap for this chunk
        const heightMap = generateHeightMap(chunkX, chunkZ);
        
        // Generate blocks based on heightmap
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const height = heightMap[x][z];
                const worldX = chunkX * CHUNK_SIZE + x;
                const worldZ = chunkZ * CHUNK_SIZE + z;
                
                // Create bedrock at bottom
                const bedrockKey = `${worldX},0,${worldZ}`;
                chunk.blocks[bedrockKey] = {
                    position: new THREE.Vector3(worldX, 0, worldZ),
                    material: materials.bedrock
                };
                
                // Fill with stone
                for (let y = 1; y < height - 2; y++) {
                    const stoneKey = `${worldX},${y},${worldZ}`;
                    chunk.blocks[stoneKey] = {
                        position: new THREE.Vector3(worldX, y, worldZ),
                        material: materials.stone
                    };
                }
                
                // Add dirt layer
                for (let y = Math.max(1, height - 2); y < height; y++) {
                    const dirtKey = `${worldX},${y},${worldZ}`;
                    chunk.blocks[dirtKey] = {
                        position: new THREE.Vector3(worldX, y, worldZ),
                        material: materials.dirt
                    };
                }
                
                // Add top layer (grass or sand)
                if (height > waterLevel + 1) {
                    // Grass on top
                    const grassKey = `${worldX},${height},${worldZ}`;
                    chunk.blocks[grassKey] = {
                        position: new THREE.Vector3(worldX, height, worldZ),
                        material: materials.grass
                    };
                } else if (height > waterLevel) {
                    // Sand near water
                    const sandKey = `${worldX},${height},${worldZ}`;
                    chunk.blocks[sandKey] = {
                        position: new THREE.Vector3(worldX, height, worldZ),
                        material: materials.sand
                    };
                } else {
                    // Underwater, use sand
                    const underwaterSandKey = `${worldX},${height},${worldZ}`;
                    chunk.blocks[underwaterSandKey] = {
                        position: new THREE.Vector3(worldX, height, worldZ),
                        material: materials.sand
                    };
                }
                
                // Add water if needed
                if (height <= waterLevel) {
                    const waterKey = `${worldX},${waterLevel + 1},${worldZ}`;
                    chunk.blocks[waterKey] = {
                        position: new THREE.Vector3(worldX, waterLevel + 1, worldZ),
                        material: materials.water
                    };
                }
            }
        }
        
        return chunk;
    }
    
    // Function to check if a block is surrounded by other blocks
    function isBlockSurrounded(x: number, y: number, z: number, chunk: Chunk): boolean {
        const surroundingPositions = [
            `${x+1},${y},${z}`, `${x-1},${y},${z}`,
            `${x},${y+1},${z}`, `${x},${y-1},${z}`,
            `${x},${y},${z+1}`, `${x},${y},${z-1}`
        ];
        
        // Check if all surrounding positions have blocks
        return surroundingPositions.every(pos => chunk.blocks[pos] !== undefined);
    }
    
    // Function to optimize a chunk by removing hidden blocks
    function optimizeChunk(chunk: Chunk): void {
        const optimizedBlocks: BlocksMap = {};
        
        // Keep only blocks that are not completely surrounded by other blocks
        Object.entries(chunk.blocks).forEach(([key, block]) => {
            const [x, y, z] = key.split(',').map(Number);
            
            // Always keep water blocks
            if (block.material === materials.water) {
                optimizedBlocks[key] = block;
                return;
            }
            
            // Keep blocks that are not completely surrounded
            if (!isBlockSurrounded(x, y, z, chunk)) {
                optimizedBlocks[key] = block;
            }
        });
        
        chunk.blocks = optimizedBlocks;
    }
    
    // Function to load a chunk (generate if needed and add to scene)
    function loadChunk(chunkX: number, chunkZ: number): void {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if already loaded
        if (chunks.has(chunkKey) && chunks.get(chunkKey)!.isLoaded) {
            return;
        }
        
        // Generate chunk if it doesn't exist
        if (!chunks.has(chunkKey)) {
            chunks.set(chunkKey, generateChunk(chunkX, chunkZ));
            optimizeChunk(chunks.get(chunkKey)!);
        }
        
        const chunk = chunks.get(chunkKey)!;
        
        // Create meshes for each block
        Object.values(chunk.blocks).forEach(block => {
            const cube = new THREE.Mesh(cubeGeometry, block.material);
            cube.position.copy(block.position);
            worldGroup.add(cube);
            
            // Store reference to the mesh for efficient removal
            block.mesh = cube;
        });
        
        chunk.isLoaded = true;
        console.log(`Loaded chunk ${chunkKey}`);
    }
    
    // Function to unload a chunk (remove from scene, keep data)
    function unloadChunk(chunkX: number, chunkZ: number): void {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if not loaded
        if (!chunks.has(chunkKey) || !chunks.get(chunkKey)!.isLoaded) {
            return;
        }
        
        const chunk = chunks.get(chunkKey)!;
        
        // Remove all block meshes from the scene
        Object.values(chunk.blocks).forEach(block => {
            if (block.mesh) {
                worldGroup.remove(block.mesh);
                // Dispose of resources to prevent memory leaks
                block.mesh.geometry.dispose();
                if (Array.isArray(block.mesh.material)) {
                    block.mesh.material.forEach(m => m.dispose());
                } else {
                    block.mesh.material.dispose();
                }
            }
        });
        
        chunk.isLoaded = false;
        console.log(`Unloaded chunk ${chunkKey}`);
    }
    
    // Function to update visible chunks based on player position
    function updateVisibleChunks(): void {
        const playerChunkX = Math.floor(camera.position.x / CHUNK_SIZE);
        const playerChunkZ = Math.floor(camera.position.z / CHUNK_SIZE);
        
        // Update debug info
        debugInfo.textContent = `Position: ${Math.floor(camera.position.x)}, ${Math.floor(camera.position.y)}, ${Math.floor(camera.position.z)}`;
        debugInfo.textContent += ` | Chunk: ${playerChunkX}, ${playerChunkZ}`;
        debugInfo.textContent += ` | Loaded Chunks: ${Array.from(chunks.values()).filter(c => c.isLoaded).length}`;
        
        // Determine which chunks should be visible
        const chunksToLoad: {x: number, z: number}[] = [];
        const chunksToUnload: {x: number, z: number}[] = [];
        
        // Check all chunks in render distance
        for (let x = playerChunkX - RENDER_DISTANCE; x <= playerChunkX + RENDER_DISTANCE; x++) {
            for (let z = playerChunkZ - RENDER_DISTANCE; z <= playerChunkZ + RENDER_DISTANCE; z++) {
                const chunkKey = `${x},${z}`;
                const distance = Math.max(Math.abs(x - playerChunkX), Math.abs(z - playerChunkZ));
                
                // If within render distance, it should be loaded
                if (distance <= RENDER_DISTANCE) {
                    if (!chunks.has(chunkKey) || !chunks.get(chunkKey)!.isLoaded) {
                        chunksToLoad.push({x, z});
                    }
                }
            }
        }
        
        // Find chunks to unload
        for (const [key, chunk] of chunks.entries()) {
            if (chunk.isLoaded) {
                const distance = Math.max(
                    Math.abs(chunk.x - playerChunkX),
                    Math.abs(chunk.z - playerChunkZ)
                );
                
                if (distance > RENDER_DISTANCE) {
                    chunksToUnload.push({x: chunk.x, z: chunk.z});
                }
            }
        }
        
        // Unload chunks that are too far
        chunksToUnload.forEach(({x, z}) => unloadChunk(x, z));
        
        // Load new chunks
        chunksToLoad.forEach(({x, z}) => loadChunk(x, z));
    }
    
    // Initialize the world with chunks around the player
    function initializeWorld(): void {
        // Generate chunks around the player first
        updateVisibleChunks();
        
        // Set player starting position above the terrain
        const playerX = 0;
        const playerZ = 0;
        const chunkX = Math.floor(playerX / CHUNK_SIZE);
        const chunkZ = Math.floor(playerZ / CHUNK_SIZE);
        
        // Ensure the spawn chunk and its neighbors are loaded
        for (let x = chunkX - 1; x <= chunkX + 1; x++) {
            for (let z = chunkZ - 1; z <= chunkZ + 1; z++) {
                if (!chunks.has(`${x},${z}`)) {
                    chunks.set(`${x},${z}`, generateChunk(x, z));
                    optimizeChunk(chunks.get(`${x},${z}`)!);
                }
            }
        }
        
        // Find the highest block at the spawn position
        let highestY = 0;
        
        // Check multiple points near the spawn to find a suitable height
        const searchRadius = 2;
        
        for (let xOffset = -searchRadius; xOffset <= searchRadius; xOffset++) {
            for (let zOffset = -searchRadius; zOffset <= searchRadius; zOffset++) {
                const checkX = playerX + xOffset;
                const checkZ = playerZ + zOffset;
                const checkChunkX = Math.floor(checkX / CHUNK_SIZE);
                const checkChunkZ = Math.floor(checkZ / CHUNK_SIZE);
                const chunkKey = `${checkChunkX},${checkChunkZ}`;
                
                if (chunks.has(chunkKey)) {
                    const chunk = chunks.get(chunkKey)!;
                    
                    // Find the highest block at this position
                    for (let y = 30; y >= 0; y--) {
                        const blockKey = `${checkX},${y},${checkZ}`;
                        if (chunk.blocks[blockKey] && 
                            chunk.blocks[blockKey].material !== materials.water) {
                            // Found a solid block, check if it's higher than our current highest
                            if (y > highestY) {
                                highestY = y;
                            }
                            break;
                        }
                    }
                }
            }
        }
        
        // Set player position to above the highest block
        const startHeight = highestY + 3; // 3 blocks above the highest terrain to ensure clear spawn
        
        // Extra safeguard - check if there are blocks at the spawn point
        const safeSpawn = new THREE.Vector3(playerX, startHeight, playerZ);
        const safeSpawn2 = new THREE.Vector3(playerX, startHeight + 1, playerZ);
        
        // If there are blocks at the spawn position, move up until it's clear
        let finalHeight = startHeight;
        while (checkCollision(safeSpawn) || checkCollision(safeSpawn2)) {
            finalHeight += 1;
            safeSpawn.y = finalHeight;
            safeSpawn2.y = finalHeight + 1;
        }
        
        console.log(`Setting player spawn at height: ${finalHeight}`);
        camera.position.set(playerX, finalHeight, playerZ);
    }
    
    // Initialize world
    console.log('Initializing world...');
    initializeWorld();
    
    // Movement variables
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let moveUp = false;
    let moveDown = false;
    let canJump = false;
    let isFlying = false; // Flying mode toggle
    
    // Handle keyboard input
    const onKeyDown = (event: KeyboardEvent) => {
        switch (event.code) {
            case 'KeyW':
                moveForward = true;
                break;
            case 'KeyA':
                moveLeft = true;
                break;
            case 'KeyS':
                moveBackward = true;
                break;
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (isFlying) {
                    moveUp = true;
                } else if (canJump) {
                    velocity.y = 10;
                    canJump = false;
                }
                break;
            case 'ShiftLeft':
                moveDown = true;
                break;
            case 'KeyF':
                // Toggle flying mode
                isFlying = !isFlying;
                console.log(`Flying mode: ${isFlying ? 'ON' : 'OFF'}`);
                
                // Show flying mode status
                const flyingStatus = document.createElement('div');
                flyingStatus.textContent = `Flying mode: ${isFlying ? 'ON' : 'OFF'}`;
                flyingStatus.style.position = 'absolute';
                flyingStatus.style.top = '10px';
                flyingStatus.style.left = '10px';
                flyingStatus.style.color = 'white';
                flyingStatus.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                flyingStatus.style.padding = '5px';
                flyingStatus.style.borderRadius = '3px';
                flyingStatus.style.fontFamily = 'monospace';
                flyingStatus.style.fontSize = '14px';
                flyingStatus.style.zIndex = '1000';
                flyingStatus.id = 'flying-status';
                
                // Remove previous status if exists
                const existingStatus = document.getElementById('flying-status');
                if (existingStatus) {
                    document.body.removeChild(existingStatus);
                }
                
                document.body.appendChild(flyingStatus);
                
                // Make status disappear after 3 seconds
                setTimeout(() => {
                    const statusElem = document.getElementById('flying-status');
                    if (statusElem) {
                        document.body.removeChild(statusElem);
                    }
                }, 3000);
                break;
        }
    };
    
    const onKeyUp = (event: KeyboardEvent) => {
        switch (event.code) {
            case 'KeyW':
                moveForward = false;
                break;
            case 'KeyA':
                moveLeft = false;
                break;
            case 'KeyS':
                moveBackward = false;
                break;
            case 'KeyD':
                moveRight = false;
                break;
            case 'Space':
                moveUp = false;
                break;
            case 'ShiftLeft':
                moveDown = false;
                break;
        }
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Collision detection helpers
    function checkCollision(position: THREE.Vector3): boolean {
        // Check if position is inside a block
        const blockX = Math.floor(position.x);
        const blockY = Math.floor(position.y);
        const blockZ = Math.floor(position.z);
        
        // Prevent checking below bedrock
        if (blockY < 0) return true;
        
        // Check across chunk boundaries
        const chunkX = Math.floor(blockX / CHUNK_SIZE);
        const chunkZ = Math.floor(blockZ / CHUNK_SIZE);
        const chunkKey = `${chunkX},${chunkZ}`;
        
        if (!chunks.has(chunkKey)) {
            // During initialization, we might need to generate the chunk
            // to check collisions properly
            if (blockY < 20) { // Only conservative check for initialization
                return true; // Assume there could be a block here
            }
            return false;
        }
        
        const chunk = chunks.get(chunkKey)!;
        const blockKey = `${blockX},${blockY},${blockZ}`;
        
        // Water is not solid for collision
        const block = chunk.blocks[blockKey];
        return block !== undefined && block.material !== materials.water;
    }
    
    function checkCollisionWithOffsets(position: THREE.Vector3, offsets: THREE.Vector3[]): boolean {
        // Check collision with multiple points (for player's body)
        return offsets.some(offset => {
            const checkPos = new THREE.Vector3(
                position.x + offset.x,
                position.y + offset.y,
                position.z + offset.z
            );
            return checkCollision(checkPos);
        });
    }
    
    // Physics and animation loop
    const gravity = -20; // Stronger gravity for more Minecraft-like feel
    const jumpForce = 10;
    const walkSpeed = 10;
    const flySpeed = 15;
    let prevTime = performance.now();
    
    function checkGroundContact(): boolean {
        // Check if player is standing on ground
        const playerPos = camera.position.clone();
        playerPos.y -= 2.0; // Check slightly below player's feet
        return checkCollision(playerPos);
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Calculate delta time
        const time = performance.now();
        const delta = (time - prevTime) / 1000; // in seconds
        prevTime = time;
        
        // Check if player moved to a new chunk and update visible chunks
        const oldChunkX = Math.floor((camera.position.x - 0.1) / CHUNK_SIZE);
        const oldChunkZ = Math.floor((camera.position.z - 0.1) / CHUNK_SIZE);
        const newChunkX = Math.floor(camera.position.x / CHUNK_SIZE);
        const newChunkZ = Math.floor(camera.position.z / CHUNK_SIZE);
        
        if (oldChunkX !== newChunkX || oldChunkZ !== newChunkZ) {
            updateVisibleChunks();
        }
        
        // Update controls only if locked
        if (controls.isLocked) {
            // Check for ground contact (only if not flying)
            if (!isFlying) {
                canJump = checkGroundContact();
            } else {
                // In flying mode, can always "jump" (fly up)
                canJump = true;
            }
            
            // Apply gravity if not flying and not on ground
            if (!isFlying && !canJump && !moveDown) {
                velocity.y += gravity * delta;
            } else if (isFlying) {
                // No gravity in flying mode, but slow down if no up/down input
                if (!moveUp && !moveDown) {
                    velocity.y *= 0.9; // Gradual slowdown
                }
            }
            
            // Calculate new position - Fix movement direction
            // Get the direction vector from the camera
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            
            // Convert camera direction to horizontal components only
            cameraDirection.y = 0;
            cameraDirection.normalize();
            
            // Calculate the camera's right vector
            const cameraRight = new THREE.Vector3(1, 0, 0);
            cameraRight.applyQuaternion(camera.quaternion);
            cameraRight.y = 0;
            cameraRight.normalize();
            
            // Vertical movement (when flying)
            if (isFlying) {
                if (moveUp) velocity.y = flySpeed;
                else if (moveDown) velocity.y = -flySpeed;
            } else if (moveDown && canJump) {
                // Only allow moving down when on ground if not flying
                velocity.y = -flySpeed;
            }
            
            // Horizontal movement - faster when flying
            const speedFactor = isFlying ? flySpeed : (canJump ? walkSpeed : walkSpeed * 0.8);
            
            // Calculate movement vector based on input
            const movementVector = new THREE.Vector3();
            
            if (moveForward) movementVector.add(cameraDirection);
            if (moveBackward) movementVector.sub(cameraDirection);
            if (moveRight) movementVector.add(cameraRight);
            if (moveLeft) movementVector.sub(cameraRight);
            
            // Normalize if moving to avoid faster diagonal movement
            if (movementVector.lengthSq() > 0) {
                movementVector.normalize();
            }
            
            // Apply horizontal movement with delta time
            velocity.x = movementVector.x * speedFactor;
            velocity.z = movementVector.z * speedFactor;
            
            // Check collision with a "capsule" around the player
            // Offsets for player's "body" collision detection
            const collisionOffsets = [
                new THREE.Vector3(0, 0, 0),     // Center
                new THREE.Vector3(0, -1, 0),    // Feet
                new THREE.Vector3(0, 1, 0),     // Head
                new THREE.Vector3(0.3, 0, 0.3), // Corners
                new THREE.Vector3(0.3, 0, -0.3),
                new THREE.Vector3(-0.3, 0, 0.3),
                new THREE.Vector3(-0.3, 0, -0.3)
            ];
            
            // In flying mode, we can disable collisions if the player is stuck
            const checkCollisions = !isFlying; // Simplified - always allow flying through blocks when in flying mode
            
            // Test X movement
            const newPosX = camera.position.clone();
            newPosX.x += velocity.x * delta;
            
            if (!checkCollisions || !checkCollisionWithOffsets(newPosX, collisionOffsets)) {
                camera.position.x = newPosX.x;
            } else {
                velocity.x = 0;
            }
            
            // Test Y movement
            const newPosY = camera.position.clone();
            newPosY.y += velocity.y * delta;
            
            if (!checkCollisions || !checkCollisionWithOffsets(newPosY, collisionOffsets)) {
                camera.position.y = newPosY.y;
            } else {
                // If going down and hit something, we're on ground
                if (velocity.y < 0) {
                    canJump = true;
                }
                velocity.y = 0;
            }
            
            // Test Z movement
            const newPosZ = camera.position.clone();
            newPosZ.z += velocity.z * delta;
            
            if (!checkCollisions || !checkCollisionWithOffsets(newPosZ, collisionOffsets)) {
                camera.position.z = newPosZ.z;
            } else {
                velocity.z = 0;
            }
            
            // Prevent falling through the ground
            const minY = 1;
            if (camera.position.y < minY) {
                camera.position.y = minY;
                canJump = true;
            }
            
            // Update debug display with flying mode info
            debugInfo.textContent = `Position: ${Math.floor(camera.position.x)}, ${Math.floor(camera.position.y)}, ${Math.floor(camera.position.z)}`;
            debugInfo.textContent += ` | Chunk: ${newChunkX}, ${newChunkZ}`;
            debugInfo.textContent += ` | Loaded Chunks: ${Array.from(chunks.values()).filter(c => c.isLoaded).length}`;
            debugInfo.textContent += ` | Flying: ${isFlying ? 'ON' : 'OFF'}`;
        }
        
        // Render scene
        renderer.render(scene, camera);
    }
    
    // Start animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Return resources for cleanup
    return {
        controls,
        scene,
        camera,
        renderer
    };
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create Minecraft world
        createMinecraftWorld();
        console.log('MinecraftTS started successfully');
    } catch (error) {
        console.error('Error starting MinecraftTS:', error);
    }
}); 