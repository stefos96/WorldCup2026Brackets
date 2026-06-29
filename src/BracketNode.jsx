import { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { createFlagTexture } from './flagTextures';

export function BracketNode({ position, teamName, countryCode, rotationY }) {
    const flagTexture = useMemo(() => createFlagTexture(countryCode), [countryCode]);

    useEffect(() => () => flagTexture.dispose(), [flagTexture]);

    return (
        <group position={position} rotation={[0, -rotationY, 0]}>
            <mesh castShadow>
                <sphereGeometry args={[0.38, 64, 32]} />
                <meshStandardMaterial
                    map={flagTexture}
                    roughness={0.42}
                    metalness={0.05}
                />
            </mesh>

            <Text
                position={[0, -0.62, 0]}
                fontSize={0.14}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.01}
                outlineColor="#0b0f19"
            >
                {teamName}
            </Text>
        </group>
    );
}
