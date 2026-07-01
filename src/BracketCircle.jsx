import { useMemo } from 'react';
import * as THREE from 'three';
import { Line, Text, Billboard } from '@react-three/drei';
import { BracketNode } from './BracketNode';

export function BracketCircle({ items, allMatches = [], radius, nextRadius, sphereSize, onNodeClick }) {
    const count = items.length;

    const getNodePlacement = (index) => {
        const angle = (index / count) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        return { angle, position: [x, 0, z] };
    };

    const fullCirclePoints = useMemo(() => {
        if (count !== 2) return [];
        const points = [];
        const segments = 64;
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
            {/* 1. Arc Grid Connection Background Lines & Floating Scores */}
            {count === 2 ? (
                <>
                    <Line points={fullCirclePoints} color="#ffdf00" lineWidth={2.5} transparent opacity={0.7} />

                    {/* Finals Score Lookup */}
                    {(() => {
                        const homeItem = items[0];
                        const awayItem = items[1];
                        if (!homeItem || !awayItem || homeItem.team === 'TBD' || awayItem.team === 'TBD') return null;

                        // Find match in global registry to verify if it has played
                        const realMatch = allMatches.find(m =>
                            (m.home === homeItem.team && m.away === awayItem.team) ||
                            (m.home === awayItem.team && m.away === homeItem.team)
                        );

                        // Only show if status is completed (3) or scores are definitively registered
                        const hasPlayed = realMatch && (realMatch.status === 3 || realMatch.homeScore !== null);

                        if (!hasPlayed) return null;

                        return (
                            <Billboard position={[0, 0.4, radius * 0.8]}>
                                <Text
                                    fontSize={0.25}
                                    color="#f59e0b"
                                    anchorX="center"
                                    anchorY="middle"
                                    font="/fonts/WorldCup26.otf"
                                    outlineWidth={0.02}
                                    outlineColor="#070a13"
                                >
                                    {`${realMatch.homeScore} - ${realMatch.awayScore}`}
                                </Text>
                            </Billboard>
                        );
                    })()}
                </>
            ) : (
                items.map((item, index) => {
                    if (index % 2 !== 0) return null;

                    const homeItem = item;
                    const awayItem = items[index + 1];

                    const { angle: angleStart } = getNodePlacement(index);
                    let { angle: angleEnd } = getNodePlacement(index + 1);

                    if (angleEnd < angleStart) angleEnd += Math.PI * 2;
                    const midAngle = (angleStart + angleEnd) / 2;

                    // Locate the exact middle of the connecting match arc
                    const scoreX = radius * Math.cos(midAngle);
                    const scoreZ = radius * Math.sin(midAngle);
                    const scorePosition = [scoreX, 0.3, scoreZ];

                    const arcPoints = [];
                    const segments = 10;
                    for (let i = 0; i <= segments; i++) {
                        const t = i / segments;
                        const currentAngle = angleStart + (angleEnd - angleStart) * t;
                        const x = radius * Math.cos(currentAngle);
                        const z = radius * Math.sin(currentAngle);
                        arcPoints.push(new THREE.Vector3(x, -0.05, z));
                    }

                    const progressionPoints = [
                        new THREE.Vector3(radius * Math.cos(midAngle), -0.05, radius * Math.sin(midAngle)),
                        new THREE.Vector3(nextRadius * Math.cos(midAngle), -0.05, nextRadius * Math.sin(midAngle))
                    ];

                    // Cross-reference with the live match list to see if this pairing has actually played yet
                    let hasPlayed = false;
                    let activeScoreText = "";

                    if (homeItem && awayItem && homeItem.team !== 'TBD' && awayItem.team !== 'TBD') {
                        const realMatch = allMatches.find(m =>
                            (m.home === homeItem.team && m.away === awayItem.team) ||
                            (m.home === awayItem.team && m.away === homeItem.team)
                        );

                        // Using your exact popup modal evaluation rules: status 3 or non-null scores
                        if (realMatch && (realMatch.status === 3 || realMatch.homeScore !== null)) {
                            hasPlayed = true;
                            // Keep score relative to how they are lined up on the circle
                            activeScoreText = realMatch.home === homeItem.team
                                ? `${realMatch.homeScore}  -  ${realMatch.awayScore}`
                                : `${realMatch.awayScore}  -  ${realMatch.homeScore}`;
                        }
                    }

                    return (
                        <group key={`lines-${item.id}`}>
                            <Line points={arcPoints} color="#475569" lineWidth={2} transparent opacity={0.5} />
                            {nextRadius > 0 && (
                                <Line points={progressionPoints} color="#475569" lineWidth={2} transparent opacity={0.5} />
                            )}

                            {/* Displays nothing if the match is scheduled but unplayed */}
                            {hasPlayed && (
                                <Billboard position={scorePosition}>
                                    <Text
                                        fontSize={0.2}
                                        color="#ffcca0"
                                        anchorX="center"
                                        anchorY="top"
                                        font="/fonts/WorldCup26.otf"
                                    >
                                        {activeScoreText}
                                    </Text>
                                </Billboard>
                            )}
                        </group>
                    );
                })
            )}

            {/* 2. Flag Sphere Match Nodes */}
            {items.map((item, index) => {
                const { angle, position } = getNodePlacement(index);

                const opponentIndex = index % 2 === 0 ? index + 1 : index - 1;
                const opponentItem = items[opponentIndex];

                const isCurrentValid = item && item.team !== 'TBD' && item.team !== '';
                const isOpponentValid = opponentItem && opponentItem.team !== 'TBD' && opponentItem.team !== '';

                const hasLink = isCurrentValid && isOpponentValid;
                const angularStep = ((opponentIndex / count) * Math.PI * 2) - angle;

                return (
                    <BracketNode
                        key={item.id}
                        position={position}
                        hasLink={hasLink}
                        angularStep={angularStep}
                        radius={radius}
                        rotationY={angle}
                        teamName={item.team}
                        countryCode={item.code}
                        size={sphereSize}
                        onClick={onNodeClick}
                    />
                );
            })}
        </group>
    );
}