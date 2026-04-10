import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Stage } from '@react-three/drei'
import { Suspense } from 'react'

function Room() {
  const { scene } = useGLTF('/room.glb')
  return <primitive object={scene} />
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Canvas shadows camera={{ position: [8, 6, 8], fov: 35 }}>
        <Suspense fallback={null}>
          <Stage environment="apartment" intensity={0.5}>
            <Room />
          </Stage>
          <OrbitControls
            makeDefault
            minDistance={3}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.2}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}