import * as THREE from 'three';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { Controls } from './Controls';

export class Game {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private world: World;
    private player: Player;
    private controls: Controls;
    private clock: THREE.Clock;
    private lastTime: number = 0;
    private frameCount: number = 0;
    private lastFpsUpdate: number = 0;
    private fps: number = 0;

    constructor() {
        console.log('Game constructor called');
        try {
            // Initialize renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            console.log('Renderer created');
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setClearColor(0x87CEEB); // Sky blue color
            const container = document.getElementById('game-container');
            console.log('Game container:', container);
            container?.appendChild(this.renderer.domElement);
            console.log('Renderer appended to container');

            // Initialize scene
            this.scene = new THREE.Scene();
            console.log('Scene created');
            
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);
            
            // Add directional light (sun)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(100, 100, 50);
            this.scene.add(directionalLight);
            console.log('Lights added');

            // Initialize camera
            this.camera = new THREE.PerspectiveCamera(
                75, 
                window.innerWidth / window.innerHeight, 
                0.1, 
                1000
            );
            console.log('Camera created');
            
            // Initialize clock for delta time
            this.clock = new THREE.Clock();
            
            // Initialize world
            console.log('Creating world...');
            this.world = new World(this.scene);
            console.log('World created');
            
            // Initialize player
            console.log('Creating player...');
            this.player = new Player(this.camera, this.world);
            console.log('Player created');
            
            // Initialize controls
            console.log('Creating controls...');
            this.controls = new Controls(this.player);
            console.log('Controls created');
            
            // Handle window resize
            window.addEventListener('resize', this.onWindowResize.bind(this));
            console.log('Game constructor completed successfully');
        } catch (error) {
            console.error('Error in Game constructor:', error);
            throw error;
        }
    }

    start(): void {
        console.log('Game.start() called');
        try {
            // Generate initial world
            console.log('Generating terrain...');
            this.world.generateTerrain();
            console.log('Terrain generated');
            
            // Start game loop
            this.lastTime = performance.now();
            this.lastFpsUpdate = this.lastTime;
            console.log('Starting animation loop...');
            this.animate();
            console.log('Animation loop started');
        } catch (error) {
            console.error('Error in Game.start():', error);
            throw error;
        }
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            
            // Update FPS display
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${this.fps}`;
            }
            
            // Update position display
            const posElement = document.getElementById('position');
            if (posElement) {
                const position = this.player.getPosition();
                posElement.textContent = `Position: X:${position.x.toFixed(1)} Y:${position.y.toFixed(1)} Z:${position.z.toFixed(1)}`;
            }
        }
        
        // Update game components
        this.player.update(deltaTime);
        this.world.update(this.player.getPosition());
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
} 