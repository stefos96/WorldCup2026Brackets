// src/App.jsx - FINALIZED (Stacked Structure with Cross-Fade & Upcoming Matches UI)

import {Suspense, useEffect, useState, useRef} from 'react';
import {Canvas, useThree} from '@react-three/fiber';
import {OrbitControls, Center, Environment} from '@react-three/drei';
import {BracketCircle} from './BracketCircle';
import {fetchRealTimeBracket, initialBracketData} from './data';
import {Trophy} from "./Trophy.jsx";
import {AnimatedBall} from "./AnimatedBall.jsx";
import gsap from 'gsap';

function CameraTarget() {
    const {camera} = useThree();
    useEffect(() => { camera.lookAt(0, 0, 0); }, [camera]);
    return null;
}

function App() {
    const [bracketData, setBracketData] = useState(initialBracketData);
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const loaderRef = useRef();

    useEffect(() => {
        const getData = async () => {
            const { bracket, upcomingMatches } = await fetchRealTimeBracket();
            setBracketData(bracket);
            setUpcomingMatches(upcomingMatches);
            setIsDataLoaded(true);
        };
        getData();
    }, []);

    const handleLaunchStarted = () => {
        if (loaderRef.current) {
            gsap.to(loaderRef.current, {
                opacity: 0,
                duration: 0.7,
                ease: 'power2.inOut',
                onComplete: () => {
                    if (loaderRef.current) {
                        loaderRef.current.style.display = 'none';
                    }
                }
            });
        }
    };

    return (
        <div style={{width: '100vw', height: '100vh', backgroundColor: '#0b0f19', position: 'relative', overflow: 'hidden', fontFamily: 'sans-serif'}}>

            {/* UPCOMING MATCHES PANEL (CHRONOLOGICALLY SORTED) */}
            {isDataLoaded && upcomingMatches.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '320px',
                    maxHeight: 'calc(100vh - 40px)',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(12px)',
                    webkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    color: '#ffffff',
                    zIndex: 10,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                    <h3 style={{margin: '0 0 4px 0', fontSize: '1.1rem', letterSpacing: '0.5px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px'}}>
                        Upcoming Matches
                    </h3>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        {upcomingMatches.map((match) => (
                            <div key={match.id} style={{
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                padding: '12px',
                                borderRadius: '8px',
                                borderLeft: '3px solid #38bdf8',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', display: 'flex', justifyContent: 'space-between'}}>
                                    <span style={{fontWeight: '500'}}>{match.stage}</span>
                                    <span style={{color: '#38bdf8'}}>{match.date}</span>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600'}}>
                                    <span style={{maxWidth: '42%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={match.home}>
                                        {match.homeCode !== 'TBD' ? match.home : 'TBD'}
                                    </span>
                                    <span style={{color: '#64748b', fontSize: '0.75rem', margin: '0 4px'}}>vs</span>
                                    <span style={{maxWidth: '42%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right'}} title={match.away}>
                                        {match.awayCode !== 'TBD' ? match.away : 'TBD'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PHASE 1: MAIN BRACKET SCENE */}
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

            {/* PHASE 2: 3D Ball Loader Overlay */}
            <div
                ref={loaderRef}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    zIndex: 999,
                    pointerEvents: 'auto',
                    background: '#0b0f19',
                    opacity: 1,
                }}
            >
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[5, 5, 5]} intensity={1.5} />
                    <Center>
                        <AnimatedBall onLaunchStarted={handleLaunchStarted} />
                    </Center>
                    <Environment preset="city" />
                </Canvas>
            </div>

        </div>
    );
}

export default App;