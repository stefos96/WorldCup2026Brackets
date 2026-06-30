import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Helper function to generate a circular glow texture asset programmatically
function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    // Create a smooth radial gradient fading out to the edge
    const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 16);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

export function PointsParticles({ count = 200 }) {
    const pointsRef = useRef();

    // Cache the positions array and texture instance so they aren't recalculated on every render
    const positions = useMemo(() => Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 40), [count]);
    const circleTexture = useMemo(() => createCircleTexture(), []);

    useFrame((state) => {
        pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
        pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.01;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array(positions), 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.18}            // Increased size slightly so the spherical glow is noticeable
                map={circleTexture}     // Maps our programmatic circle canvas onto the particle
                transparent={true}
                opacity={0.6}
                sizeAttenuation={true}
                depthWrite={false}      // Prevents the square background boxes of the textures from clipping each other
                blending={THREE.AdditiveBlending} // Optional: makes overlapping spheres glow brighter
            />
        </points>
    );
}