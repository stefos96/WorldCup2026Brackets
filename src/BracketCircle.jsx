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

    // SPECIAL LOGIC FOR FINALS: Generate a single continuous circle that wraps around both ways
    const fullCirclePoints = useMemo(() => {
        if (count !== 2) return [];
        const points = [];
        const segments = 64; // Higher segments make a perfectly smooth continuous ring

        for (let i = 0; i <= segments; i++) {
            const currentAngle = (i / segments) * Math.PI * 2;
            const x = radius * Math.cos(currentAngle);
            const z = radius * Math.sin(currentAngle);
            points.push(new THREE.Vector3(x, -0.05, z));
        }
        return points;
    }, [count, radius]);

    return (
        <group>
            {/* 1. Condition: Render Full Ring for Finals, or standard match arcs for earlier rounds */}
            {count === 2 ? (
                <Line
                    points={fullCirclePoints}
                    color="#ffdf00" // Optional: Golden accent ring for the grand finals
                    lineWidth={2.5}
                    transparent
                    opacity={0.7}
                />
            ) : (
                items.map((item, index) => {
                    if (index % 2 !== 0) return null;

                    const { angle: angleStart } = getNodePlacement(index);
                    let { angle: angleEnd } = getNodePlacement(index + 1);

                    if (angleEnd < angleStart) {
                        angleEnd += Math.PI * 2;
                    }

                    const midAngle = (angleStart + angleEnd) / 2;

                    // Match arc line tracking the radius perimeter path
                    const arcPoints = [];
                    const segments = 10;
                    for (let i = 0; i <= segments; i++) {
                        const t = i / segments;
                        const currentAngle = angleStart + (angleEnd - angleStart) * t;
                        const x = radius * Math.cos(currentAngle);
                        const z = radius * Math.sin(currentAngle);
                        arcPoints.push(new THREE.Vector3(x, -0.05, z));
                    }

                    // Inward progression line
                    const progressionPoints = [
                        new THREE.Vector3(radius * Math.cos(midAngle), -0.05, radius * Math.sin(midAngle)),
                        new THREE.Vector3(nextRadius * Math.cos(midAngle), -0.05, nextRadius * Math.sin(midAngle))
                    ];

                    return (
                        <group key={`lines-${item.id}`}>
                            <Line points={arcPoints} color="#475569" lineWidth={2} transparent opacity={0.5} />
                            {nextRadius > 0 && (
                                <Line points={progressionPoints} color="#475569" lineWidth={2} transparent opacity={0.5} />
                            )}
                        </group>
                    );
                })
            )}

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