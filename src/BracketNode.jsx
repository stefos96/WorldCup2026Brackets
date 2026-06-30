import { useEffect, useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import { createFlagTexture } from './flagTextures';

export function BracketNode({ position, teamName, countryCode, rotationY }) {
    const [hovered, setHovered] = useState(false);

    const flagTexture = useMemo(() => createFlagTexture(countryCode), [countryCode]);

    // Generate a soft, blurred circular gradient canvas texture for the box-shadow effect
    const glowTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Create a radial gradient: white center fading out to total transparency
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(5, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(5, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(5, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }, []);

    useEffect(() => {
        return () => {
            flagTexture.dispose();
            glowTexture.dispose();
        };
    }, [flagTexture, glowTexture]);

    return (
        <group
            position={position}
            rotation={[0, -rotationY, 0]}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
        >
            {/* Core Flag Sphere */}
            <mesh castShadow>
                <sphereGeometry args={[0.38, 64, 32]} />
                <meshStandardMaterial
                    map={flagTexture}
                    roughness={0.42}
                    metalness={0.05}
                />
            </mesh>

            {/* Fading Box-Shadow Glow (Sprite stays facing the camera natively) */}
            {hovered && (
                <sprite scale={[1.4, 1.4, 1]}>
                    <spriteMaterial
                        map={glowTexture}
                        color="#ffffff"
                        transparent
                        opacity={0.3}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false} // Prevents box artifact outlines behind the sphere
                    />
                </sprite>
            )}

            {/* Billboard wrapper forces everything inside it to tracking-rotate to the camera */}
            <Billboard
                follow={true}
                lockX={false}
                lockY={false}
                lockZ={false}
                position={[0, -0.62, 0]} // Position handled at billboard root level
            >
                <Text
                    fontSize={0.14}
                    color={hovered ? "#ffffff" : "#cbd5e1"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.01}
                    outlineColor="#0b0f19"
                >
                    {teamName}
                </Text>
            </Billboard>
        </group>
    );
}