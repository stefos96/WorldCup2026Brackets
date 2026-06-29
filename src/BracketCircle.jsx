import { Line } from '@react-three/drei';
import { BracketNode } from './BracketNode';

export function BracketCircle({ items, radius }) {
    const count = items.length;
    const getNodePlacement = (index) => {
        // Calculate the angle for this specific node
        const angle = (index / count) * Math.PI * 2;

        // Trigonometry for circular placement
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        return { angle, position: [x, 0, z] };
    };

    return (
        <group>
            {items.map((item, index) => {
                if (index % 2 !== 0) {
                    return null;
                }

                const start = getNodePlacement(index).position;
                const end = getNodePlacement(index + 1).position;

                return (
                    <Line
                        key={`match-line-${item.id}`}
                        points={[
                            [start[0], -0.05, start[2]],
                            [end[0], -0.05, end[2]],
                        ]}
                        color="#e2e8f0"
                        lineWidth={2}
                        transparent
                        opacity={0.6}
                    />
                );
            })}

            {items.map((item, index) => {
                const { angle, position } = getNodePlacement(index);

                return (
                    <BracketNode
                        key={item.id}
                        position={position}
                        rotationY={angle} // Rotates the card to face the center
                        teamName={item.team}
                        countryCode={item.code}
                    />
                );
            })}
        </group>
    );
}
