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
}

interface BlocksMap {
    [key: string]: Block;
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
    
    // Create a larger voxel grid (32x32)
    const gridSize = 32;
    const cubeSize = 1;
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
    
    // Create a group to hold all cubes
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    
    // Simple noise function for terrain generation
    function noise(x: number, z: number): number {
        // Simple noise function based on sine waves
        const frequency1 = 0.02;
        const frequency2 = 0.05;
        const frequency3 = 0.1;
        
        const height1 = Math.sin(x * frequency1) * Math.cos(z * frequency1) * 5;
        const height2 = Math.sin(x * frequency2 + 0.1) * Math.cos(z * frequency2) * 2;
        const height3 = Math.sin(x * frequency3 + 0.2) * Math.cos(z * frequency3) * 1;
        
        return height1 + height2 + height3;
    }
    
    // Generate a larger terrain
    console.log('Generating terrain...');
    
    // Create a heightmap
    const heightMap: number[][] = [];
    for (let x = 0; x < gridSize; x++) {
        heightMap[x] = [];
        for (let z = 0; z < gridSize; z++) {
            // Calculate world coordinates
            const worldX = x - gridSize / 2;
            const worldZ = z - gridSize / 2;
            
            // Generate height using noise function
            const baseHeight = 5;
            const noiseHeight = noise(worldX, worldZ);
            const height = Math.floor(baseHeight + noiseHeight);
            
            heightMap[x][z] = height;
        }
    }
    
    // Create blocks based on heightmap
    const blocks: BlocksMap = {};
    const waterLevel = 3;
    
    for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
            const height = heightMap[x][z];
            
            // Create bedrock at bottom
            const key = `${x},0,${z}`;
            blocks[key] = {
                position: new THREE.Vector3(x - gridSize / 2, 0, z - gridSize / 2),
                material: materials.bedrock
            };
            
            // Fill with stone
            for (let y = 1; y < height - 2; y++) {
                const key = `${x},${y},${z}`;
                blocks[key] = {
                    position: new THREE.Vector3(x - gridSize / 2, y, z - gridSize / 2),
                    material: materials.stone
                };
            }
            
            // Add dirt layer
            for (let y = Math.max(1, height - 2); y < height; y++) {
                const key = `${x},${y},${z}`;
                blocks[key] = {
                    position: new THREE.Vector3(x - gridSize / 2, y, z - gridSize / 2),
                    material: materials.dirt
                };
            }
            
            // Add top layer (grass or sand)
            if (height > waterLevel + 1) {
                // Grass on top
                const key = `${x},${height},${z}`;
                blocks[key] = {
                    position: new THREE.Vector3(x - gridSize / 2, height, z - gridSize / 2),
                    material: materials.grass
                };
            } else if (height > waterLevel) {
                // Sand near water
                const key = `${x},${height},${z}`;
                blocks[key] = {
                    position: new THREE.Vector3(x - gridSize / 2, height, z - gridSize / 2),
                    material: materials.sand
                };
            } else {
                // Underwater, use sand
                const key = `${x},${height},${z}`;
                blocks[key] = {
                    position: new THREE.Vector3(x - gridSize / 2, height, z - gridSize / 2),
                    material: materials.sand
                };
            }
            
            // Add water if needed
            if (height <= waterLevel) {
                const key = `${x},${waterLevel + 1},${z}`;
                blocks[key] = {
                    position: new THREE.Vector3(x - gridSize / 2, waterLevel + 1, z - gridSize / 2),
                    material: materials.water
                };
            }
        }
    }
    
    // Create instanced mesh for better performance
    console.log('Creating block meshes...');
    
    // Create meshes for each block type
    Object.values(blocks).forEach(block => {
        const cube = new THREE.Mesh(cubeGeometry, block.material);
        cube.position.copy(block.position);
        worldGroup.add(cube);
    });
    
    console.log('Terrain generated');
    
    // Set player starting position above the terrain
    const centerX = Math.floor(gridSize / 2);
    const centerZ = Math.floor(gridSize / 2);
    const startHeight = heightMap[centerX][centerZ] + 3; // Start a bit higher to avoid spawning in ground
    camera.position.set(0, startHeight, 0);
    
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
                if (canJump) {
                    velocity.y += 8; // Reduced jump height for better control
                    canJump = false;
                }
                break;
            case 'ShiftLeft':
                moveDown = true;
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
            case 'ShiftLeft':
                moveDown = false;
                break;
        }
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Simple collision detection
    function checkCollision(position: THREE.Vector3): boolean {
        // Convert world position to grid coordinates
        const gridX = Math.floor(position.x + gridSize / 2);
        const gridY = Math.floor(position.y);
        const gridZ = Math.floor(position.z + gridSize / 2);
        
        // Check if position is within grid bounds
        if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= 20 || gridZ < 0 || gridZ >= gridSize) {
            return false;
        }
        
        // Check if there's a block at this position
        const key = `${gridX},${gridY},${gridZ}`;
        return blocks[key] !== undefined;
    }
    
    // More precise collision detection with offset checking
    function checkCollisionWithOffsets(position: THREE.Vector3, offsets: THREE.Vector3[]): boolean {
        // Check the main position
        if (checkCollision(position)) {
            return true;
        }
        
        // Check all offset positions
        for (const offset of offsets) {
            const offsetPosition = position.clone().add(offset);
            if (checkCollision(offsetPosition)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Clock for consistent movement speed
    const clock = new THREE.Clock();
    
    // Animation function
    function animate() {
        requestAnimationFrame(animate);
        
        if (controls.isLocked) {
            const delta = Math.min(clock.getDelta(), 0.1); // Cap delta to prevent large jumps
            
            // Apply gravity
            velocity.y -= 20.0 * delta; // Increased gravity for better feel
            
            // Get movement direction relative to camera orientation
            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveLeft) - Number(moveRight);
            direction.normalize(); // Normalize to prevent faster diagonal movement
            
            // Convert direction to be relative to camera orientation
            if (direction.x !== 0 || direction.z !== 0) {
                // Get camera's forward direction (excluding y component)
                const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                cameraDirection.y = 0;
                cameraDirection.normalize();
                
                // Get camera's right direction
                const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
                cameraRight.y = 0;
                cameraRight.normalize();
                
                // Calculate movement vector based on camera orientation
                const moveVector = new THREE.Vector3();
                moveVector.addScaledVector(cameraDirection, direction.z);
                moveVector.addScaledVector(cameraRight, -direction.x); // Negative because left is negative X
                moveVector.normalize();
                
                // Apply movement - allow air control but with reduced effect
                const onGround = checkGroundContact();
                const speed = onGround ? 9.0 : 6.0;
                
                velocity.x = moveVector.x * speed * delta;
                velocity.z = moveVector.z * speed * delta;
            } else {
                // No movement input, gradually slow down
                const onGround = checkGroundContact();
                const dampFactor = onGround ? 0.9 : 0.98;
                velocity.x *= dampFactor;
                velocity.z *= dampFactor;
            }
            
            // Apply vertical movement (for flying mode)
            if (moveUp) velocity.y += 5.0 * delta;
            if (moveDown) velocity.y -= 5.0 * delta;
            
            // Move the camera
            const oldPosition = camera.position.clone();
            
            // Try moving on each axis separately for better collision response
            const newPosition = oldPosition.clone();
            
            // Define player dimensions
            const playerHeight = 1.7; // Slightly shorter than 2 blocks
            const playerWidth = 0.4;  // Player is less than half a block wide
            
            // Create collision check offsets for the player's body
            const playerOffsets = [
                new THREE.Vector3(0, playerHeight/2, 0), // Head
                new THREE.Vector3(0, -playerHeight/2 + 0.1, 0), // Feet (slightly above ground)
                new THREE.Vector3(playerWidth, 0, 0), // Right
                new THREE.Vector3(-playerWidth, 0, 0), // Left
                new THREE.Vector3(0, 0, playerWidth), // Front
                new THREE.Vector3(0, 0, -playerWidth), // Back
            ];
            
            // Try X movement
            newPosition.x = oldPosition.x + velocity.x;
            if (checkCollisionWithOffsets(newPosition, playerOffsets)) {
                newPosition.x = oldPosition.x;
                velocity.x = 0;
            }
            
            // Try Z movement
            newPosition.z = oldPosition.z + velocity.z;
            if (checkCollisionWithOffsets(newPosition, playerOffsets)) {
                newPosition.z = oldPosition.z;
                velocity.z = 0;
            }
            
            // Try Y movement
            newPosition.y = oldPosition.y + velocity.y * delta;
            if (checkCollisionWithOffsets(newPosition, playerOffsets)) {
                if (velocity.y < 0) {
                    // We hit something below us
                    canJump = true;
                }
                newPosition.y = oldPosition.y;
                velocity.y = 0;
            }
            
            // Update camera position
            camera.position.copy(newPosition);
            
            // Prevent extremely slow movement
            if (Math.abs(velocity.x) < 0.01) velocity.x = 0;
            if (Math.abs(velocity.z) < 0.01) velocity.z = 0;
        }
        
        renderer.render(scene, camera);
    }
    
    // Check if player is on the ground
    function checkGroundContact(): boolean {
        const groundCheckPosition = camera.position.clone();
        groundCheckPosition.y -= 0.95; // Check slightly below player
        
        return checkCollision(groundCheckPosition);
    }
    
    // Start animation
    console.log('Starting animation...');
    animate();
    console.log('Animation started');
}

// Initialize when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Minecraft world...');
    try {
        createMinecraftWorld();
    } catch (error) {
        console.error('Error creating Minecraft world:', error);
    }
}); 