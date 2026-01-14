'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Neural network nodes - Viettel Red & White theme
function NeuralNodes({ count = 200, radius = 2.5 }: { count?: number; radius?: number }) {
    const pointsRef = useRef<THREE.Points>(null)
    const linesRef = useRef<THREE.LineSegments>(null)

    const { positions, connections, nodeColors } = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const nodeColors = new Float32Array(count * 3)
        const connectionPositions: number[] = []

        // Create brain-shaped distribution
        for (let i = 0; i < count; i++) {
            // Spherical distribution with brain-like shape
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)

            // Brain shape modifier
            const brainShape = 1 + 0.3 * Math.sin(phi * 2) * Math.cos(theta * 3)
            const r = radius * brainShape * (0.7 + Math.random() * 0.3)

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = r * Math.cos(phi) * 0.8 // Flatten slightly
            positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

            // Color gradient: red to white (Viettel brand)
            const t = i / count
            if (t < 0.6) {
                // Red to light red
                nodeColors[i * 3] = 0.9 + t * 0.1     // R
                nodeColors[i * 3 + 1] = t * 0.3        // G
                nodeColors[i * 3 + 2] = t * 0.3        // B
            } else {
                // Light red to white
                const t2 = (t - 0.6) / 0.4
                nodeColors[i * 3] = 1                   // R
                nodeColors[i * 3 + 1] = 0.2 + t2 * 0.8 // G
                nodeColors[i * 3 + 2] = 0.2 + t2 * 0.8 // B
            }
        }

        // Create connections between nearby nodes
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dx = positions[i * 3] - positions[j * 3]
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
                const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

                if (dist < 0.8 && Math.random() > 0.7) {
                    connectionPositions.push(
                        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                    )
                }
            }
        }

        return {
            positions,
            connections: new Float32Array(connectionPositions),
            nodeColors
        }
    }, [count, radius])

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1
            pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
        }
        if (linesRef.current) {
            linesRef.current.rotation.y = state.clock.elapsedTime * 0.1
            linesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
        }
    })

    return (
        <group>
            {/* Neural nodes */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={count}
                        array={positions}
                        itemSize={3}
                        args={[positions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={count}
                        array={nodeColors}
                        itemSize={3}
                        args={[nodeColors, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.08}
                    vertexColors
                    transparent
                    opacity={0.9}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Neural connections - Viettel Red */}
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={connections.length / 3}
                        array={connections}
                        itemSize={3}
                        args={[connections, 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial
                    color="#E60012"
                    transparent
                    opacity={0.2}
                    blending={THREE.AdditiveBlending}
                />
            </lineSegments>
        </group>
    )
}

// Pulsing core - Viettel Red
function BrainCore() {
    const coreRef = useRef<THREE.Mesh>(null)
    const glowRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (coreRef.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
            coreRef.current.scale.setScalar(pulse)
        }
        if (glowRef.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + Math.PI) * 0.15
            glowRef.current.scale.setScalar(pulse)
        }
    })

    return (
        <group>
            {/* Inner core - White */}
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[0.5, 2]} />
                <meshBasicMaterial
                    color="#FFFFFF"
                    transparent
                    opacity={0.9}
                    wireframe
                />
            </mesh>

            {/* Outer glow - Viettel Red */}
            <mesh ref={glowRef}>
                <icosahedronGeometry args={[0.7, 1]} />
                <meshBasicMaterial
                    color="#E60012"
                    transparent
                    opacity={0.4}
                    wireframe
                />
            </mesh>
        </group>
    )
}

// Orbiting data rings - Red & White theme
function DataRings() {
    const ring1Ref = useRef<THREE.Mesh>(null)
    const ring2Ref = useRef<THREE.Mesh>(null)
    const ring3Ref = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        const t = state.clock.elapsedTime
        if (ring1Ref.current) {
            ring1Ref.current.rotation.x = t * 0.3
            ring1Ref.current.rotation.z = t * 0.2
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.y = t * 0.4
            ring2Ref.current.rotation.x = Math.PI / 3
        }
        if (ring3Ref.current) {
            ring3Ref.current.rotation.z = t * 0.25
            ring3Ref.current.rotation.y = Math.PI / 4
        }
    })

    return (
        <group>
            <mesh ref={ring1Ref}>
                <torusGeometry args={[2.25, 0.02, 16, 100]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.5} />
            </mesh>
            <mesh ref={ring2Ref}>
                <torusGeometry args={[2.75, 0.015, 16, 100]} />
                <meshBasicMaterial color="#E60012" transparent opacity={0.4} />
            </mesh>
            <mesh ref={ring3Ref}>
                <torusGeometry args={[3.25, 0.01, 16, 100]} />
                <meshBasicMaterial color="#FF3344" transparent opacity={0.3} />
            </mesh>
        </group>
    )
}

// Floating particles - Mixed red and white
function FloatingParticles({ count = 100 }: { count?: number }) {
    const particlesRef = useRef<THREE.Points>(null)

    const { positions, colors } = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const col = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 15
            pos[i * 3 + 1] = (Math.random() - 0.5) * 15
            pos[i * 3 + 2] = (Math.random() - 0.5) * 15

            // Random red or white
            if (Math.random() > 0.4) {
                col[i * 3] = 0.9      // R
                col[i * 3 + 1] = 0.0  // G
                col[i * 3 + 2] = 0.07 // B (Viettel Red)
            } else {
                col[i * 3] = 1        // R
                col[i * 3 + 1] = 1    // G
                col[i * 3 + 2] = 1    // B (White)
            }
        }
        return { positions: pos, colors: col }
    }, [count])

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02

            const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
            for (let i = 0; i < count; i++) {
                positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true
        }
    })

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={count}
                    array={colors}
                    itemSize={3}
                    args={[colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                vertexColors
                transparent
                opacity={0.7}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

// Energy beams emanating from brain - Red/White theme
function EnergyBeams() {
    const beamsRef = useRef<THREE.Group>(null)

    const beams = useMemo(() => {
        const beamData = []
        const beamCount = 12
        for (let i = 0; i < beamCount; i++) {
            const angle = (i / beamCount) * Math.PI * 2
            beamData.push({
                position: [Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5] as [number, number, number],
                rotation: [0, -angle, Math.PI / 2 + (Math.random() - 0.5) * 0.5] as [number, number, number],
                length: 3 + Math.random() * 2,
                delay: i * 0.1
            })
        }
        return beamData
    }, [])

    useFrame((state) => {
        if (beamsRef.current) {
            beamsRef.current.children.forEach((beam, i) => {
                const t = state.clock.elapsedTime + beams[i].delay
                const scale = 0.5 + Math.sin(t * 2) * 0.5
                beam.scale.y = scale * beams[i].length
                const material = (beam as THREE.Mesh).material as THREE.MeshBasicMaterial
                material.opacity = 0.1 + Math.sin(t * 2) * 0.1
            })
        }
    })

    return (
        <group ref={beamsRef}>
            {beams.map((beam, i) => (
                <mesh
                    key={i}
                    position={beam.position}
                    rotation={beam.rotation}
                >
                    <cylinderGeometry args={[0.01, 0.001, 1, 8]} />
                    <meshBasicMaterial
                        color={i % 2 === 0 ? '#E60012' : '#FFFFFF'}
                        transparent
                        opacity={0.2}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    )
}

export default function NeuralBrain({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
    return (
        <group scale={0.55} position={position}>
            <NeuralNodes count={200} radius={2.2} />
            <BrainCore />
            <DataRings />
            <FloatingParticles count={100} />
            <EnergyBeams />
        </group>
    )
}
