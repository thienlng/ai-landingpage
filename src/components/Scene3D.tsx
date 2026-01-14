'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { Suspense } from 'react'
import NetMindBrain from './NetMindBrain'
import EarthHemisphere from './EarthHemisphere'
import NetworkMesh from './NetworkMesh'
import SatelliteApps from './SatelliteApps'

export default function Scene3D() {
    return (
        <div className="fixed inset-0 z-0 w-full h-full">
            <Canvas
                camera={{ position: [0, 0, 10], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    {/* Keep in sync with CSS var --netmind-dark (can't reference CSS vars here) */}
                    <color attach="background" args={['#0A0000']} />

                    <fog attach="fog" args={['#0A0000', 5, 20]} />

                    {/* Lighting */}
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />

                    {/* Main Components */}
                    <group position={[0, 1.5, 0]}>
                        <NetMindBrain />
                    </group>
                    <group rotation={[0.4, 0, 0]}> {/* Tilt the earth/network slightly for better view */}
                        <EarthHemisphere />
                        <NetworkMesh />
                    </group>
                    <group position={[0, 1.5, 0]}>
                        <SatelliteApps />
                    </group>

                    {/* Environment */}
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <Environment preset="city" />

                    {/* Post Processing */}
                    <EffectComposer>
                        <Bloom
                            intensity={1.5}
                            luminanceThreshold={0.2}
                            luminanceSmoothing={0.9}
                            height={300}
                        />
                        <Noise opacity={0.02} />
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                    </EffectComposer>

                    {/* Interaction */}
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        autoRotate={false}
                        maxPolarAngle={Math.PI / 1.5}
                        minPolarAngle={Math.PI / 3}
                    />
                </Suspense>
            </Canvas>
        </div>
    )
}
