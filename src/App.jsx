// src/App.jsx

import {Suspense, useEffect, useState, useRef} from 'react';
import {Canvas, useThree} from '@react-three/fiber';
import {OrbitControls, Center, Environment} from '@react-three/drei';
import {BracketCircle} from './BracketCircle';
import {fetchRealTimeBracket, initialBracketData} from './data';
import {Trophy} from "./Trophy.jsx";
import {AnimatedBall} from "./AnimatedBall.jsx";
import gsap from 'gsap';
import './scss/app.scss';
import {Logo} from "./Logo.jsx"; // Inject SCSS Stylesheets

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
        <div className="app-container">

            <Logo />

            {/* UPCOMING MATCHES PANEL */}
            {isDataLoaded && upcomingMatches.length > 0 && (
                <div className="upcoming-matches-panel">
                    <h3>Upcoming Matches</h3>

                    <div className="matches-list">
                        {upcomingMatches.map((match) => (
                            <div key={match.id} className="match-card">
                                <div className="card-header">
                                    <span>{match.stage}</span>
                                    <span className="date-highlight">{match.date}</span>
                                </div>
                                <div className="card-body">
                                    <span className="team-name" title={match.home}>
                                        {match.homeCode !== 'TBD' ? match.home : 'TBD'}
                                    </span>
                                    <span className="vs-divider">vs</span>
                                    <span className="team-name away" title={match.away}>
                                        {match.awayCode !== 'TBD' ? match.away : 'TBD'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PHASE 1: MAIN BRACKET SCENE */}
            <div
                className="bracket-scene-wrapper"
                style={{
                    visibility: isDataLoaded ? 'visible' : 'hidden',
                    opacity: isDataLoaded ? 1 : 0
                }}
            >
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
            <div ref={loaderRef} className="loader-overlay">
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