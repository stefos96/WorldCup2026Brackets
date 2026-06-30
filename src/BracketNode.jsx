import { useEffect, useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { createFlagTexture } from './flagTextures';

// 3D Fast, Tilted, Trail-Simulating Particle Engine
function OrbitParticles({ count = 35, sphereRadius = 0.38 }) {
    const meshRef = useRef();

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const currentPos = useMemo(() => new THREE.Vector3(), []);
    const nextPos = useMemo(() => new THREE.Vector3(), []);
    const movementDir = useMemo(() => new THREE.Vector3(), []);
    const quaternionMat = useMemo(() => new THREE.Quaternion(), []);

    // Generate static initial random parameters for each particle
    const particleData = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            // Generate a completely randomized 3D tilt axis vector
            const randomAxis = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();

            data.push({
                angleOffset: Math.random() * Math.PI * 2,
                speed: 5.0 + Math.random() * 4.0,             // Fast movement speed
                radiusOffset: 0.05 + Math.random() * 0.15,    // Tighter orbital boundaries
                yOffset: (Math.random() - 0.5) * 0.1,         // Slight local flight variation
                scaleX: 0.005 + Math.random() * 0.006,        // Tiny width/thickness
                scaleZ: 0.05 + Math.random() * 0.07,          // Stretched length to simulate a fast velocity streak/trail
                axis: randomAxis,                             // Permanent fixed rotation plane
                axisTiltAngle: Math.random() * Math.PI        // Static orientation angle for this axis
            });
        }
        return data;
    }, [count]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();

        particleData.forEach((p, i) => {
            // 1. Calculate active target angle cleanly advancing over time
            const currentAngle = p.angleOffset + (time * p.speed);
            const activeRadius = sphereRadius + p.radiusOffset;

            // 2. Compute current position on a clean flat frame
            currentPos.set(
                Math.cos(currentAngle) * activeRadius,
                p.yOffset,
                Math.sin(currentAngle) * activeRadius
            );
            // Apply fixed tilt offset angle so the orbital plane stays rigid
            currentPos.applyAxisAngle(p.axis, p.axisTiltAngle);

            // 3. Compute fractional look-ahead position to properly align trail stretch vector
            const lookAheadAngle = currentAngle + 0.01;
            nextPos.set(
                Math.cos(lookAheadAngle) * activeRadius,
                p.yOffset,
                Math.sin(lookAheadAngle) * activeRadius
            );
            nextPos.applyAxisAngle(p.axis, p.axisTiltAngle);

            // 4. Orient trail vector to stretch directly backwards from direction of travel
            movementDir.subVectors(nextPos, currentPos).normalize();
            quaternionMat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movementDir);

            // 5. Build transform matrices
            dummy.position.copy(currentPos);
            dummy.quaternion.copy(quaternionMat);
            dummy.scale.set(p.scaleX, p.scaleX, p.scaleZ);
            dummy.updateMatrix();

            meshRef.current.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <sphereGeometry args={[1, 4, 4]} />
            <meshStandardMaterial
                color="#62fdff"
                emissive="#62fdff"
                emissiveIntensity={3.0} // Enhanced brightness brings out the glowing trail illusion
                transparent
                opacity={0.9}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    );
}

export function BracketNode({ position, teamName, countryCode, rotationY }) {
    const [hovered, setHovered] = useState(false);

    const flagTexture = useMemo(() => createFlagTexture(countryCode), [countryCode]);

    const glowTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(5, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(5, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(5, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        return new THREE.CanvasTexture(canvas);
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

            {/* Fading Box-Shadow Glow & 3D Volumetric Particles */}
            {hovered && (
                <>
                    <sprite scale={[1.4, 1.4, 1]}>
                        <spriteMaterial
                            map={glowTexture}
                            color="#ffffff"
                            transparent
                            opacity={0.25}
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                        />
                    </sprite>

                    <OrbitParticles count={25} sphereRadius={0.58} />
                </>
            )}

            {/* Billboard Text always facing the reader */}
            <Billboard
                follow={true}
                lockX={false}
                lockY={false}
                lockZ={false}
                position={[0, -0.62, 0]}
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