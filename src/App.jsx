// src/App.jsx
import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { BracketCircle } from './BracketCircle';
import { initialBracketData } from './data';

function CameraTarget() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

function App() {
  return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0b0f19' }}>
        <Canvas camera={{ position: [0, 15, 20], fov: 50 }}>
          <CameraTarget />

          {/* Lights */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <Center>
            {/* Outermost: Round of 32 */}
            <BracketCircle items={initialBracketData.roundOf32} radius={10} />

            {/* Round of 16 */}
            <BracketCircle items={initialBracketData.roundOf16} radius={7.5} />

            {/* Quarterfinals */}
            <BracketCircle items={initialBracketData.quarterFinals} radius={5} />

            {/* Semifinals */}
            <BracketCircle items={initialBracketData.semiFinals} radius={3} />

            {/* Finals */}
            <BracketCircle items={initialBracketData.finals} radius={1.2} />
          </Center>

          {/* Camera Controls */}
          <OrbitControls enableDamping maxPolarAngle={Math.PI / 2 - 0.05} />
        </Canvas>
      </div>
  );
}

export default App;
