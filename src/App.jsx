// src/App.jsx
import {Suspense, useEffect, useState} from 'react';
import {Canvas, useThree} from '@react-three/fiber';
import {OrbitControls, Center} from '@react-three/drei';
import {BracketCircle} from './BracketCircle';
import {fetchRealTimeBracket, initialBracketData} from './data';
import {Trophy} from "./Trophy.jsx";

function CameraTarget() {
    const {camera} = useThree();


    useEffect(() => {
        camera.lookAt(0, 0, 0);
    }, [camera]);

    return null;
}

function App() {
    const [bracketData, setBracketData] = useState(initialBracketData);

    useEffect(() => {
        const getData = async () => {
            const liveData = await fetchRealTimeBracket();
            setBracketData(liveData);
        };

        getData();
    }, []);

    return (
        <div style={{width: '100vw', height: '100vh', backgroundColor: '#0b0f19'}}>
            <Canvas camera={{position: [0, 15, 20], fov: 50}}>
                <CameraTarget/>

                {/* Lights */}
                <ambientLight intensity={0.6}/>
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow/>
                <pointLight position={[-10, -10, -10]} intensity={0.5}/>

                <Suspense fallback={null}>

                    <group position={[0, 0, 0]}>
                        <Trophy/>
                    </group>

                    <group rotation={[0, 0, 0]}>
                        <BracketCircle items={bracketData.roundOf32} radius={10} nextRadius={7.5} sphereSize={0.4}/>
                    </group>

                    {/* Offset the inner rings so their match midpoints lock with the outer straight lines */}
                    <group rotation={[0, Math.PI / 10.8, 0]}>
                        <BracketCircle items={bracketData.roundOf16} radius={7.5} nextRadius={5} sphereSize={0.45}/>
                    </group>

                    <group rotation={[0, Math.PI / 32, 0]}>
                        <BracketCircle items={bracketData.quarterFinals} radius={5} nextRadius={3} sphereSize={0.5}/>
                    </group>

                    <group rotation={[0, Math.PI / 1.1
                        , 0]}>
                        <BracketCircle items={bracketData.semiFinals} radius={3} nextRadius={1.2} sphereSize={0.55}/>
                    </group>

                    <group rotation={[0, Math.PI / 1.5, 0]}>
                        <BracketCircle items={bracketData.finals} radius={1.2} nextRadius={0} sphereSize={0.6}/>
                    </group>

                </Suspense>

                {/*<Center>*/}
                {/*    /!* Outermost ring matches base coordinates *!/*/}
                {/*    <group rotation={[0, 0, 0]}>*/}
                {/*        <BracketCircle items={bracketData.roundOf32} radius={10} nextRadius={7.5} sphereSize={0.4} />*/}
                {/*    </group>*/}

                {/*    /!* Offset the inner rings so their match midpoints lock with the outer straight lines *!/*/}
                {/*    <group rotation={[0, Math.PI / 10.8, 0]}>*/}
                {/*        <BracketCircle items={bracketData.roundOf16} radius={7.5} nextRadius={5} sphereSize={0.45} />*/}
                {/*    </group>*/}

                {/*    <group rotation={[0, Math.PI / 32, 0]}>*/}
                {/*        <BracketCircle items={bracketData.quarterFinals} radius={5} nextRadius={3} sphereSize={0.5} />*/}
                {/*    </group>*/}

                {/*    <group rotation={[0, Math.PI / 1.1*/}
                {/*        , 0]}>*/}
                {/*        <BracketCircle items={bracketData.semiFinals} radius={3} nextRadius={1.2} sphereSize={0.55} />*/}
                {/*    </group>*/}

                {/*    <group rotation={[0, Math.PI / 1.5, 0]}>*/}
                {/*        <BracketCircle items={bracketData.finals} radius={1.2} nextRadius={0} sphereSize={0.6} />*/}
                {/*    </group>*/}
                {/*</Center>*/}

                {/* Camera Controls */}
                <OrbitControls enableDamping maxPolarAngle={Math.PI / 2 - 0.05}/>
            </Canvas>
        </div>
    );
}

export default App;
