'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Viettel Red/White Theme
const COLORS = {
    red: '#E60012',
    lightRed: '#FF3344',
    darkRed: '#B8000F',
    white: '#FFFFFF'
}

const APPS = [
    { name: 'CoDev', color: COLORS.white, radius: 4.0, speed: 0.2, yOffset: 0.5 },
    { name: 'PowerSaving', color: COLORS.lightRed, radius: 4.8, speed: 0.1, yOffset: -0.5 },
    { name: 'Chatbot', color: COLORS.red, radius: 3.5, speed: 0.3, yOffset: 0 },
    { name: 'PCTT', color: COLORS.darkRed, radius: 4.4, speed: 0.15, yOffset: 0.8 },
]

export default function SatelliteApps() {
    const groupRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (groupRef.current) {
            // Rotate the whole system slowly
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.02
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
    const groupRef = useRef<THREE.Group>(null)
    const coreRef = useRef<THREE.Mesh>(null)
    const ringRef = useRef<THREE.Mesh>(null)
    const textRef = useRef<THREE.Group>(null)

    // Random rotation axis for the core
    const rotationAxis = useMemo(() => new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), [])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        const angle = t * speed + initialAngle
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        // Orbital motion
        if (groupRef.current) {
            groupRef.current.position.set(x, yOffset + Math.sin(t * 1.5) * 0.2, z)
        }

        // Self rotation
        if (coreRef.current) {
            coreRef.current.rotateOnAxis(rotationAxis, 0.02)
        }

        // Ring rotation
        if (ringRef.current) {
            ringRef.current.rotation.x = Math.sin(t) * 0.5
            ringRef.current.rotation.y = t * 2
        }

        // Text Billboard
        if (textRef.current) {
            textRef.current.lookAt(state.camera.position)
        }
    })

    return (
        <group ref={groupRef}>
            {/* Core Tech Node */}
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[0.2, 0]} />
                <meshBasicMaterial
                    color={color}
                    wireframe
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Inner Solid Core */}
            <mesh>
                <icosahedronGeometry args={[0.1, 0]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} />
            </mesh>

            {/* Orbiting Ring */}
            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.3, 0.005, 8, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>

            {/* Connecting Line to Center (Visual implication only via trailing particles if needed, but keeping simple for now) */}

            {/* Label */}
            <group ref={textRef} position={[0, 0.4, 0]}>
                <Text
                    fontSize={0.15}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.01}
                    outlineColor="#000000"
                >
                    {name}
                </Text>
            </group>
        </group>
    )
}
