import { useEffect, useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { createFlagTexture } from './flagTextures';

// Sub-Component: Dynamic Particle Beam
function LinkParticles({ count = 40, radius, angularStep }) {
    const meshRef = useRef();

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const currentPos = useMemo(() => new THREE.Vector3(), []);
    const nextPos = useMemo(() => new THREE.Vector3(), []);
    const movementDir = useMemo(() => new THREE.Vector3(), []);
    const quaternionMat = useMemo(() => new THREE.Quaternion(), []);

    const particleData = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            const travelDirection = Math.random() > 0.5 ? 1 : -1;
            data.push({
                progressOffset: Math.random(),
                speed: 4.5 + Math.random() * 2.0,
                direction: travelDirection,
                spreadX: (Math.random() - 0.5) * 0.18,
                spreadY: (Math.random() - 0.5) * 0.18,
                waveFrequency: 4 + Math.random() * 7,
                waveAmplitude: 0.03 + Math.random() * 0.06,
                scaleX: 0.001 + Math.random() * 0.004,
                scaleZ: 0.01 + Math.random() * 0.07
            });
        }
        return data;
    }, [count]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();

        particleData.forEach((p, i) => {
            // Compute percentage path interpolation between 0 and 1
            let t = (p.progressOffset + (time * p.speed * 0.22)) % 1.0;
            if (p.direction === -1) t = 1.0 - t;

            // Step A: Interpolate target path linearly across the local rotation arc
            const targetArcAngle = angularStep * t;

            // Step B: Map clean trigonometric circle updates relative to local node orientation [0,0,0]
            currentPos.set(
                radius * Math.cos(targetArcAngle) - radius,
                0,
                radius * Math.sin(targetArcAngle)
            );

            // Add dynamic turbulence to the beam
            const arc = Math.sin(t * Math.PI) * Math.sin(time * 3 + i) * p.waveAmplitude;
            currentPos.x += p.spreadX;
            currentPos.y += p.spreadY + arc;
            currentPos.z += Math.sin(t * p.waveFrequency) * p.waveAmplitude * 0.4;

            // Look-ahead tracking setup for rotation orientation calculations
            const deltaT = p.direction * 0.01;
            let lookAheadT = THREE.MathUtils.clamp(t + deltaT, 0, 1);
            const nextArcAngle = angularStep * lookAheadT;

            nextPos.set(
                radius * Math.cos(nextArcAngle) - radius,
                0,
                radius * Math.sin(nextArcAngle)
            );
            const nextArc = Math.sin(lookAheadT * Math.PI) * Math.sin(time * 3 + i) * p.waveAmplitude;
            nextPos.x += p.spreadX;
            nextPos.y += p.spreadY + nextArc;
            nextPos.z += Math.sin(lookAheadT * p.waveFrequency) * p.waveAmplitude * 0.4;

            // Align particle orientation matrices based on the movement direction
            if (p.direction === 1) {
                movementDir.subVectors(nextPos, currentPos).normalize();
            } else {
                movementDir.subVectors(currentPos, nextPos).normalize();
            }
            quaternionMat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movementDir);

            // Commit matrix steps down into Instanced WebGL Buffer
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
                emissiveIntensity={3.5}
                transparent
                opacity={0.9}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    );
}

export function BracketNode({ position, hasLink, angularStep, radius, teamName, countryCode, rotationY }) {
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

            {/* Hover Effects Layout System */}
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

                    {/* Localized particle beam engine */}
                    {hasLink && (
                        <LinkParticles count={55} radius={radius} angularStep={angularStep} />
                    )}
                </>
            )}

            {/* Billboard Text Element */}
            <Billboard position={[0, -0.62, 0]}>
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