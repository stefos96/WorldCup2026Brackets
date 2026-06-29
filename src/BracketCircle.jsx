import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { BracketNode } from './BracketNode';

export function BracketCircle({ items, radius, nextRadius, sphereSize }) {
    const count = items.length;

    const getNodePlacement = (index) => {
        const angle = (index / count) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        return { angle, position: [x, 0, z] };
    };

    return (
        <group>
            {/* 1. Arc & Progression Lines */}
            {items.map((item, index) => {
                if (index % 2 !== 0) return null;

                const { angle: angleStart } = getNodePlacement(index);
                let { angle: angleEnd } = getNodePlacement(index + 1);

                if (angleEnd < angleStart) {
                    angleEnd += Math.PI * 2;
                }

                // Midpoint angle of the current match arc
                const midAngle = (angleStart + angleEnd) / 2;

                // A. Generate the curved match arc points
                const arcPoints = useMemo(() => {
                    const points = [];
                    const segments = 10;
                    for (let i = 0; i <= segments; i++) {
                        const t = i / segments;
                        const currentAngle = angleStart + (angleEnd - angleStart) * t;
                        const x = radius * Math.cos(currentAngle);
                        const z = radius * Math.sin(currentAngle);
                        points.push(new THREE.Vector3(x, -0.05, z));
                    }
                    return points;
                }, [angleStart, angleEnd, radius]);

                // B. Generate the straight inward progression line
                // Starts at the arc's midpoint radius, shoots straight inward to the next ring's radius
                const progressionPoints = useMemo(() => {
                    if (!nextRadius) return []; // Stop at the final ring

                    const startX = radius * Math.cos(midAngle);
                    const startZ = radius * Math.sin(midAngle);

                    const endX = nextRadius * Math.cos(midAngle);
                    const endZ = nextRadius * Math.sin(midAngle);

                    return [
                        new THREE.Vector3(startX, -0.05, startZ),
                        new THREE.Vector3(endX, -0.05, endZ)
                    ];
                }, [midAngle, radius, nextRadius]);

                return (
                    <group key={`lines-${item.id}`}>
                        {/* The horizontal circular match connector */}
                        <Line
                            points={arcPoints}
                            color="#475569"
                            lineWidth={2}
                            transparent
                            opacity={0.5}
                        />
                        {/* The straight vertical line shooting toward the next round */}
                        {nextRadius && (
                            <Line
                                points={progressionPoints}
                                color="#475569"
                                lineWidth={2}
                                transparent
                                opacity={0.5}
                            />
                        )}
                    </group>
                );
            })}

            {/* 2. Bracket Nodes */}
            {items.map((item, index) => {
                const { angle, position } = getNodePlacement(index);

                return (
                    <BracketNode
                        key={item.id}
                        position={position}
                        rotationY={angle}
                        teamName={item.team}
                        countryCode={item.code}
                        size={sphereSize}
                    />
                );
            })}
        </group>
    );
}