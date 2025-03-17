import * as THREE from 'three';
import { World } from '../world/World';

export class Player {
    private camera: THREE.PerspectiveCamera;
    private world: World;
    private position: THREE.Vector3;
    private velocity: THREE.Vector3;
    private rotation: THREE.Euler;
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private moveUp: boolean = false;
    private moveDown: boolean = false;
    private speed: number = 5.0; // Units per second
    private gravity: number = 9.8;
    private jumpForce: number = 5.0;
    private isOnGround: boolean = false;
    private playerHeight: number = 1.8; // Player height in blocks
    private playerWidth: number = 0.6; // Player width in blocks
    private eyeHeight: number = 1.6; // Eye height from ground

    constructor(camera: THREE.PerspectiveCamera, world: World) {
        this.camera = camera;
        this.world = world;
        this.position = new THREE.Vector3(0, 50, 0); // Start high up to fall onto the terrain
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        
        // Set initial camera position
        this.updateCamera();
    }

    update(deltaTime: number): void {
        // Apply gravity
        if (!this.isOnGround) {
            this.velocity.y -= this.gravity * deltaTime;
        }
        
        // Calculate movement direction based on camera rotation
        const moveDirection = new THREE.Vector3();
        
        if (this.moveForward) {
            moveDirection.z -= 1;
        }
        if (this.moveBackward) {
            moveDirection.z += 1;
        }
        if (this.moveLeft) {
            moveDirection.x -= 1;
        }
        if (this.moveRight) {
            moveDirection.x += 1;
        }
        
        // Normalize movement direction if moving diagonally
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }
        
        // Apply rotation to movement direction
        moveDirection.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
        
        // Apply movement to velocity
        this.velocity.x = moveDirection.x * this.speed;
        this.velocity.z = moveDirection.z * this.speed;
        
        // Handle jumping and vertical movement
        if (this.moveUp && this.isOnGround) {
            this.velocity.y = this.jumpForce;
            this.isOnGround = false;
        } else if (this.moveUp && !this.isOnGround && this.moveDown) {
            // If both up and down are pressed while in air, do nothing (cancel out)
            this.velocity.y = 0;
        } else if (this.moveDown && this.isOnGround) {
            // Crouch or go down (not implemented yet)
        }
        
        // Apply velocity to position
        const newPosition = this.position.clone().add(
            this.velocity.clone().multiplyScalar(deltaTime)
        );
        
        // Check for collisions and adjust position
        this.handleCollisions(newPosition);
        
        // Update camera position
        this.updateCamera();
    }

    private handleCollisions(newPosition: THREE.Vector3): void {
        // Simple collision detection with blocks
        const checkPositions = [
            new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z), // Center
            new THREE.Vector3(newPosition.x + this.playerWidth/2, newPosition.y, newPosition.z), // Right
            new THREE.Vector3(newPosition.x - this.playerWidth/2, newPosition.y, newPosition.z), // Left
            new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z + this.playerWidth/2), // Front
            new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z - this.playerWidth/2), // Back
        ];
        
        // Check horizontal collisions (X and Z)
        let canMoveX = true;
        let canMoveZ = true;
        
        for (const pos of checkPositions) {
            // Check if there's a block at the new position
            if (this.world.getBlock(
                Math.floor(pos.x), 
                Math.floor(newPosition.y), 
                Math.floor(pos.z)
            )) {
                // If there's a block at the new X position, prevent X movement
                if (Math.floor(pos.x) !== Math.floor(this.position.x)) {
                    canMoveX = false;
                }
                
                // If there's a block at the new Z position, prevent Z movement
                if (Math.floor(pos.z) !== Math.floor(this.position.z)) {
                    canMoveZ = false;
                }
            }
            
            // Also check at eye level
            if (this.world.getBlock(
                Math.floor(pos.x), 
                Math.floor(newPosition.y + this.eyeHeight), 
                Math.floor(pos.z)
            )) {
                // If there's a block at the new X position, prevent X movement
                if (Math.floor(pos.x) !== Math.floor(this.position.x)) {
                    canMoveX = false;
                }
                
                // If there's a block at the new Z position, prevent Z movement
                if (Math.floor(pos.z) !== Math.floor(this.position.z)) {
                    canMoveZ = false;
                }
            }
        }
        
        // Apply horizontal movement if allowed
        if (canMoveX) {
            this.position.x = newPosition.x;
        } else {
            this.velocity.x = 0;
        }
        
        if (canMoveZ) {
            this.position.z = newPosition.z;
        } else {
            this.velocity.z = 0;
        }
        
        // Check vertical collisions (Y)
        // Check if there's a block below the player
        const blockBelow = this.world.getBlock(
            Math.floor(this.position.x), 
            Math.floor(newPosition.y - 0.1), // Check slightly below feet
            Math.floor(this.position.z)
        );
        
        if (blockBelow && newPosition.y < Math.ceil(blockBelow.y) + 1) {
            // Player is on ground
            this.position.y = Math.ceil(blockBelow.y) + 1;
            this.velocity.y = 0;
            this.isOnGround = true;
        } else {
            // Player is in air
            this.position.y = newPosition.y;
            this.isOnGround = false;
            
            // Check if there's a block above the player
            const blockAbove = this.world.getBlock(
                Math.floor(this.position.x), 
                Math.floor(newPosition.y + this.playerHeight + 0.1), // Check slightly above head
                Math.floor(this.position.z)
            );
            
            if (blockAbove && newPosition.y + this.playerHeight > blockAbove.y) {
                // Player hit ceiling
                this.position.y = blockAbove.y - this.playerHeight;
                this.velocity.y = 0;
            }
        }
    }

    private updateCamera(): void {
        // Update camera position to match player's eye position
        this.camera.position.copy(this.position);
        this.camera.position.y += this.eyeHeight;
        
        // Update camera rotation to match player's rotation
        this.camera.rotation.copy(this.rotation);
    }

    rotate(pitchDelta: number, yawDelta: number): void {
        // Update rotation
        this.rotation.x += pitchDelta;
        this.rotation.y += yawDelta;
        
        // Clamp pitch to prevent flipping
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        
        // Update camera rotation
        this.camera.rotation.copy(this.rotation);
    }

    setMovement(
        forward: boolean, 
        backward: boolean, 
        left: boolean, 
        right: boolean, 
        up: boolean, 
        down: boolean
    ): void {
        this.moveForward = forward;
        this.moveBackward = backward;
        this.moveLeft = left;
        this.moveRight = right;
        this.moveUp = up;
        this.moveDown = down;
    }

    getPosition(): THREE.Vector3 {
        return this.position.clone();
    }
} 