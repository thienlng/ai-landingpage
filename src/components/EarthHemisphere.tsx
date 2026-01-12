'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'

export default function EarthHemisphere() {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame(() => {
        if (meshRef.current) {
            // Slow rotation for the earth
            meshRef.current.rotation.y -= 0.0005
        }
    })

    return (
        <group position={[0, -9, 0]}>
            {/* Earth Surface - Wireframe/Tech look */}
            <Sphere ref={meshRef} args={[6.5, 64, 64]}>
                <meshStandardMaterial
                    color="#b91c1c" // Dark Red
                    wireframe
                    transparent
                    opacity={0.2}
                    roughness={0.8}
                    metalness={0.5}
                />
            </Sphere>

            {/* Solid inner core to block background stars if any, and give weight */}
            <Sphere args={[6.4, 64, 64]}>
                <meshBasicMaterial color="#000000" />
            </Sphere>
        </group>
    )
}
