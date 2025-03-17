import { Player } from '../player/Player';

export class Controls {
    private player: Player;
    private keys: { [key: string]: boolean } = {};
    private isPointerLocked: boolean = false;
    private mouseSensitivity: number = 0.002;

    constructor(player: Player) {
        this.player = player;
        
        // Set up event listeners
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('click', this.onMouseClick.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    }

    private onKeyDown(event: KeyboardEvent): void {
        this.keys[event.code] = true;
        
        // Update player movement based on keys
        this.updatePlayerMovement();
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.keys[event.code] = false;
        
        // Update player movement based on keys
        this.updatePlayerMovement();
    }

    private onMouseClick(): void {
        // Request pointer lock on click
        if (!this.isPointerLocked) {
            document.body.requestPointerLock();
        }
    }

    private onMouseMove(event: MouseEvent): void {
        if (this.isPointerLocked) {
            // Rotate player based on mouse movement
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            
            this.player.rotate(
                -movementY * this.mouseSensitivity, 
                -movementX * this.mouseSensitivity
            );
        }
    }

    private onPointerLockChange(): void {
        this.isPointerLocked = document.pointerLockElement === document.body;
    }

    private updatePlayerMovement(): void {
        const moveForward = this.keys['KeyW'] || false;
        const moveBackward = this.keys['KeyS'] || false;
        const moveLeft = this.keys['KeyA'] || false;
        const moveRight = this.keys['KeyD'] || false;
        const moveUp = this.keys['Space'] || false;
        const moveDown = this.keys['ShiftLeft'] || false;
        
        this.player.setMovement(
            moveForward, 
            moveBackward, 
            moveLeft, 
            moveRight, 
            moveUp, 
            moveDown
        );
    }
} 