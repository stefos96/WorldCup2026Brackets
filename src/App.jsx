// src/App.jsx - FINALIZED (Stacked Structure with Cross-Fade)

import {Suspense, useEffect, useState, useRef} from 'react';
import {Canvas, useThree} from '@react-three/fiber';
import {OrbitControls, Center, Environment} from '@react-three/drei';
import {BracketCircle} from './BracketCircle';
import {fetchRealTimeBracket, initialBracketData} from './data';
import {Trophy} from "./Trophy.jsx";
import {AnimatedBall} from "./AnimatedBall.jsx";
// GSAP is required here for the div container fade-out
import gsap from 'gsap';

function CameraTarget() {
    const {camera} = useThree();
    useEffect(() => { camera.lookAt(0, 0, 0); }, [camera]);
    return null;
}

function App() {
    const [bracketData, setBracketData] = useState(initialBracketData);
    // 1. Data loading state to avoid empty bracket spheres during fade
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // 2. Ref to the entire Loader overlay container
    const loaderRef = useRef();

    useEffect(() => {
        const getData = async () => {
            const liveData = await fetchRealTimeBracket();
            setBracketData(liveData);
            setIsDataLoaded(true); // Signal that bracket content is ready
        };
        getData();
    }, []);

    // 3. New Prop/Callback: Fired when Ball *starts* its fly-off sequence.
    // We initiate the cross-fade immediately to remove the void.
    const handleLaunchStarted = () => {
        if (loaderRef.current) {
            // Smoothly fade out the solid background container.
            // The bracket scene (pre-rendered) is revealed.
            gsap.to(loaderRef.current, {
                opacity: 0,
                duration: 0.7, // Cross-fade duration
                ease: 'power2.inOut',
                // Unmount the loader ONLY after it is fully invisible
                onComplete: () => {
                    if (loaderRef.current) {
                        loaderRef.current.style.display = 'none';
                    }
                }
            });
        }
    };

    return (
        <div style={{width: '100vw', height: '100vh', backgroundColor: '#0b0f19', position: 'relative', overflow: 'hidden'}}>

            {/* PHASE 1: MAIN BRACKET SCENE (PRE-RENDERED)
              This is MOUNTED and rendering in the background from the start.
              It is hidden until data is ready to avoid placeholder flicker.
            */}
            <div style={{
                width: '100%', height: '100%',
                visibility: isDataLoaded ? 'visible' : 'hidden',
                opacity: isDataLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease'
            }}>
                <Canvas camera={{position: [0, 15, 20], fov: 50}}>
                    <CameraTarget/>
                    <ambientLight intensity={0.6}/>
                    <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow/>
                    <pointLight position={[-10, -10, -10]} intensity={0.5}/>

                    <Suspense fallback={null}>
                        {/* We use isDataLoaded instead of isAppVisible to pre-render */}
                        <group>
                            <group position={[0, 0, 0]}><Trophy/></group>
                            <group rotation={[0, 0, 0]}><BracketCircle items={bracketData.roundOf32} radius={10} nextRadius={7.5} sphereSize={0.4}/></group>
                            <group rotation={[0, Math.PI / .5077, 0]}><BracketCircle items={bracketData.roundOf16} radius={7.5} nextRadius={5} sphereSize={0.45}/></group>
                            <group rotation={[0, Math.PI / 1.52, 0]}><BracketCircle items={bracketData.quarterFinals} radius={5} nextRadius={3} sphereSize={0.5}/></group>
                            <group rotation={[0, Math.PI / 1.88, 0]}><BracketCircle items={bracketData.semiFinals} radius={3} nextRadius={1.2} sphereSize={0.55}/></group>
                            <group rotation={[0, Math.PI / 1.3, 0]}><BracketCircle items={bracketData.finals} radius={1.2} nextRadius={0} sphereSize={0.6}/></group>
                        </group>
                    </Suspense>

                    <OrbitControls enableDamping maxPolarAngle={Math.PI / 2 - 0.05}/>
                </Canvas>
            </div>

            {/* PHASE 2: 3D Ball Loader Overlay (STACKED ON TOP)
              We apply loaderRef here. We unmount only after fade-out.
            */}
            <div
                ref={loaderRef}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    zIndex: 999, // Stays on top
                    pointerEvents: 'auto', // Important to catch pointer while fading
                    background: '#0b0f19', // Solid background that we will fade
                    opacity: 1, // Stays fully visible
                }}
            >
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[5, 5, 5]} intensity={1.5} />
                    <Center>
                        {/* We use the new callback prop: onLaunchStarted */}
                        <AnimatedBall onLaunchStarted={handleLaunchStarted} />
                    </Center>
                    <Environment preset="city" />
                </Canvas>
            </div>

        </div>
    );
}

export default App;