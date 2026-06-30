export function getBracketNodePlacement({ count, radius, index, angleOffset = 0 }) {
    const angle = ((index + angleOffset) / count) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    return { angle, position: [x, 0, z] };
}
