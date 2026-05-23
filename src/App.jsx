import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Stage } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import { useControls, button, folder } from 'leva'
import { Room } from './components/r3f/Room'

function CameraController() {
  const { camera, controls } = useThree()

  const [, set] = useControls('Camera', () => ({
    Position: folder({
      camX: { value: 29.61, step: 0.001, disabled: true },
      camY: { value: -24.70, step: 0.001, disabled: true },
      camZ: { value: -10.17, step: 0.001, disabled: true },
    }),
    Target: folder({
      tarX: { value: -2.11, step: 0.001, disabled: true },
      tarY: { value: -30.50, step: 0.001, disabled: true },
      tarZ: { value: -10.12, step: 0.001, disabled: true },
    }),
    'Copy Values': button(() => {
      const pos = camera.position
      const tar = controls?.target
      console.log('📷 Camera position:', {
        x: parseFloat(pos.x.toFixed(3)),
        y: parseFloat(pos.y.toFixed(3)),
        z: parseFloat(pos.z.toFixed(3)),
      })
      console.log('🎯 Controls target:', {
        x: parseFloat(tar.x.toFixed(3)),
        y: parseFloat(tar.y.toFixed(3)),
        z: parseFloat(tar.z.toFixed(3)),
      })
    }),
  }))

  // Update Leva values as you orbit
  useEffect(() => {
    if (!controls) return

    const onUpdate = () => {
      set({
        camX: parseFloat(camera.position.x.toFixed(3)),
        camY: parseFloat(camera.position.y.toFixed(3)),
        camZ: parseFloat(camera.position.z.toFixed(3)),
        tarX: parseFloat(controls.target.x.toFixed(3)),
        tarY: parseFloat(controls.target.y.toFixed(3)),
        tarZ: parseFloat(controls.target.z.toFixed(3)),
      })
    }

    controls.addEventListener('change', onUpdate)
    return () => controls.removeEventListener('change', onUpdate)
  }, [controls, camera, set])

  return null
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Canvas camera={{ position: [29.61, -24.70, -10.17], fov: 35 }}>
        <Suspense fallback={null}>
          <Stage environment="apartment" intensity={0.5} adjustCamera={false}>
            <Room />
          </Stage>
          <OrbitControls makeDefault target={[-2.11, -30.50, -10.12]} />
          <CameraController />
        </Suspense>
      </Canvas>
    </div>
  )
}

