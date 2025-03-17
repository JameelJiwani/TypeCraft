import * as THREE from 'three';

// Function to create a simple colored texture for testing
export function createColorTexture(color: string): THREE.Texture {
    console.log(`Creating color texture with color: ${color}`);
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = color;
            context.fillRect(0, 0, 16, 16);
        } else {
            console.error('Failed to get 2D context from canvas');
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        
        console.log('Color texture created successfully');
        return texture;
    } catch (error) {
        console.error('Error creating color texture:', error);
        throw error;
    }
}

// Function to create a simple texture atlas for testing
export function createTextureAtlas(): THREE.Texture {
    console.log('Creating texture atlas...');
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        
        const context = canvas.getContext('2d');
        if (context) {
            // Define colors for different block types
            const colors = [
                '#7FFF7F', // Grass top (green)
                '#7F7F7F', // Stone (gray)
                '#8B4513', // Dirt (brown)
                '#8B4513', // Grass side (brown with green top)
                '#8B6914', // Wood (light brown)
                '#228B22', // Leaves (dark green)
                '#C2B280', // Sand (tan)
                '#000000', // Bedrock (black)
                '#0000FF'  // Water (blue)
            ];
            
            console.log(`Drawing ${colors.length} textures to atlas...`);
            // Draw 16x16 textures in the atlas
            for (let i = 0; i < colors.length; i++) {
                const x = (i % 16) * 16;
                const y = Math.floor(i / 16) * 16;
                
                // Fill with base color
                context.fillStyle = colors[i];
                context.fillRect(x, y, 16, 16);
                
                // Add some texture/detail
                context.fillStyle = 'rgba(0, 0, 0, 0.1)';
                
                // Draw a grid pattern
                for (let gx = 0; gx < 16; gx += 4) {
                    for (let gy = 0; gy < 16; gy += 4) {
                        if ((gx + gy) % 8 === 0) {
                            context.fillRect(x + gx, y + gy, 2, 2);
                        }
                    }
                }
                
                // Special case for grass side (add green top)
                if (i === 3) {
                    context.fillStyle = '#7FFF7F';
                    context.fillRect(x, y, 16, 4);
                }
            }
            console.log('Textures drawn to atlas');
        } else {
            console.error('Failed to get 2D context from canvas');
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        
        console.log('Texture atlas created successfully');
        return texture;
    } catch (error) {
        console.error('Error creating texture atlas:', error);
        throw error;
    }
} 