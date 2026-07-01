// src/AnimatedBall.jsx - FINALIZED (Synced Fly-off)

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import gsap from 'gsap';

// Updated Prop: We signal launch start rather than completion
export function AnimatedBall({ onLaunchStarted }) {
    const ballRef = useRef();

    // Assumes file is at /public/models/world_cup_2026_ball.glb
    const { scene } = useGLTF('/models/world_cup_2026_ball.glb');

    useEffect(() => {
        if (!ballRef.current) return;

        // Reset state for clean animation start
        gsap.set(ballRef.current.position, { x: 0, y: 0, z: 0 });
        gsap.set(ballRef.current.rotation, { x: 0, y: 0, z: 0 });

        const tl = gsap.timeline();

        // ** PHASE 1: ZOOM IN AND STABILIZE (Duration 1.8s) **
        tl.to(ballRef.current.scale, {
            x: 1.5,
            y: 1.5,
            z: 1.5,
            duration: 1.5,
            ease: 'power2.out',
        })
            .to(ballRef.current.rotation, {
                y: -Math.PI / 8, // Settle slight angle
                duration: 0.6,
                ease: 'sine.inOut'
            }, "-=0.3"); // slight overlap

        // ** PHASE 2: FLY-OFF (Trigger Cross-fade START) **
        tl.addLabel("launchTime");

        // 1. SIGNAL PARENT.
        // We trigger the fade-out in App.jsx *right now* as Phase 2 starts.
        tl.call(() => {
            if (onLaunchStarted) {
                onLaunchStarted();
            }
        }, null, "launchTime"); // Specify exact label

        // 2. Fly-off Sequence (Keeps running uninterrupted while background fades)
        tl.to(ballRef.current.rotation, {
            y: Math.PI * 10, // Super fast spin (5 full rotations)
            x: -Math.PI / 3, // Tilt as it launches
            duration: 1.5,
            ease: 'sine.in',
        }, "launchTime") // Sync start
            .to(ballRef.current.position, {
                z: -25,  // Fly back to exit screen
                x: 18,   // Off-angle exit
                y: 6,    // Rise up
                duration: 1.4,
            }, "<+=0.1"); // Sync slightly after spin start

    }, [onLaunchStarted]);

    // Constant baseline idle spinning
    useFrame((state, delta) => {
        if (ballRef.current) {
            ballRef.current.rotation.y += delta * 0.4;
        }
    });

    return (
        <primitive
            ref={ballRef}
            object={scene}
            position={[0, 0, 0]}
            scale={[3.5, 3.5, 3.5]} // Heavier initial zoom-in
        />
    );
}

// Preload the model asset
useGLTF.preload('/models/world_cup_2026_ball.glb');