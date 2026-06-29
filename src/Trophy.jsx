import React, { useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

export function Trophy() {
    const { scene } = useGLTF('/models/world_cup_trophy.glb');

    // Automatically make the materials highly reflective and slightly emissive
    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Boost reflections to make gold pop in the dark
                if (child.material) {
                    child.material.roughness = 0.15;
                    child.material.metalness = 0.9;

                    // Add a very subtle internal gold/white glow to the material itself
                    child.material.emissiveIntensity = 0.15;
                }
            }
        });
    }, [scene]);

    return (
        <group>
            {/* 1. Dedicated point light to cast a rich golden bloom outwards */}
            <pointLight
                position={[0, 5.5, 0]}
                intensity={155}
                distance={6}
                color="#ffdf00"
                castShadow
                shadow-bias={-0.001}
            />

            {/* 2. Soft upward spotlight to highlight the trophy silhouette */}
            <spotLight
                position={[0, -1.8, 0]}
                angle={0.6}
                penumbra={1}
                intensity={515}
                color="#ffffff"
                target={scene}
            />

            <Center top>
                <primitive
                    position={[0, -1.5, 0]}
                    object={scene}
                    scale={5}
                />
            </Center>
        </group>
    );
}

useGLTF.preload('/models/world_cup_trophy.glb');