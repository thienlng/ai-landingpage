'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'

const APPS = [
    { name: 'CoDev', color: '#10b981', radius: 4.0, speed: 0.5, yOffset: 0.5 },
    { name: 'PowerSaving', color: '#f59e0b', radius: 4.8, speed: 0.3, yOffset: -0.5 },
    { name: 'Chatbot', color: '#ec4899', radius: 3.5, speed: 0.7, yOffset: 0 },
    { name: 'PCTT', color: '#3b82f6', radius: 4.4, speed: 0.4, yOffset: 0.8 },
]

export default function SatelliteApps() {
    const groupRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (groupRef.current) {
            // Rotate the whole system slowly
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
        }
    })

    return (
        <group ref={groupRef} rotation={[0.2, 0, 0]}>
            {APPS.map((app, i) => (
                <Satellite
                    key={i}
                    {...app}
                    initialAngle={(i / APPS.length) * Math.PI * 2}
                />
            ))}
        </group>
    )
}

function Satellite({ name, color, radius, speed, yOffset, initialAngle }: { name: string, color: string, radius: number, speed: number, yOffset: number, initialAngle: number }) {
    const meshRef = useRef<THREE.Mesh>(null)
    const textRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        const t = state.clock.getElapsedTime() * speed + initialAngle
        const x = Math.cos(t) * radius
        const z = Math.sin(t) * radius

        if (meshRef.current) {
            meshRef.current.position.set(x, yOffset + Math.sin(t * 2) * 0.2, z) // slight vertical bob
        }
        if (textRef.current) {
            textRef.current.position.set(x, yOffset + 0.4, z)
            textRef.current.lookAt(state.camera.position)
        }
    })

    return (
        <>
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
            </mesh>
            <group ref={textRef}>
                <Text
                    fontSize={0.2}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {name}
                </Text>
            </group>
        </>
    )
}
