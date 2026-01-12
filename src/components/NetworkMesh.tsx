'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

// Number of BTS nodes
const NODE_COUNT = 25
const EARTH_RADIUS = 6.5

export default function NetworkMesh() {
    const groupRef = useRef<THREE.Group>(null)

    // Generate evenly spaced positions using Fibonacci Lattice on the upper surface
    const nodes = useMemo(() => {
        const temp = []
        const phi = (Math.sqrt(5) + 1) / 2 - 1; // Golden Ratio
        const ga = phi * 2 * Math.PI;
        const types = ['3G', '4G', '5G'] as const

        for (let i = 0; i < NODE_COUNT; i++) {
            const lon = ga * i;
            // Distribute lat from 0 (top) down to some angle.
            // i goes 0..NODE_COUNT.
            // To be on top cap, z (local up) should be close to 1.
            // Let's use 1 - (i / (NODE_COUNT - 1)) * coverage
            const lat = Math.asin(-1 + 2 * i / (NODE_COUNT * 2 + 1)); // This is full sphere

            // i / (NODE_COUNT-1) from 0 to 1.
            const t = i / (NODE_COUNT - 1)
            const inclination = Math.acos(1 - 0.4 * t) // 0.4 covers top ~20% of sphere surface area (cap)
            const azimuth = 2 * Math.PI * phi * i

            const x = EARTH_RADIUS * Math.sin(inclination) * Math.cos(azimuth)
            const y = EARTH_RADIUS * Math.cos(inclination) // This is local Y (up)
            const z = EARTH_RADIUS * Math.sin(inclination) * Math.sin(azimuth)

            temp.push({
                pos: new THREE.Vector3(x, y, z),
                type: types[Math.floor(Math.random() * types.length)],
                delay: Math.random() * 2
            })
        }
        return temp
    }, [])

    // Create connections with arcs (curved along surface)
    // Constraint: 2-4 connections per node
    const linesGeometry = useMemo(() => {
        const points: THREE.Vector3[] = []
        const SEGMENTS = 12
        const connections = Array.from({ length: nodes.length }, () => new Set<number>())

        // 1. Build Adjacency Graph
        for (let i = 0; i < nodes.length; i++) {
            const potential = []
            for (let j = 0; j < nodes.length; j++) {
                if (i !== j) {
                    potential.push({ id: j, dist: nodes[i].pos.distanceTo(nodes[j].pos) })
                }
            }
            potential.sort((a, b) => a.dist - b.dist)

            // Connect to nearest neighbors (Target ~3 connections)
            for (const n of potential) {
                // If we have reached target density for this node, stop trying to initiate
                if (connections[i].size >= 3) break

                const j = n.id
                // If neighbor is saturated (cap at 4), skip
                if (connections[j].size >= 4) continue

                // Add bidirectional connection
                connections[i].add(j)
                connections[j].add(i)
            }
        }

        // Ensure minimum connectivity (at least 2 if possible)
        for (let i = 0; i < nodes.length; i++) {
            if (connections[i].size < 2) {
                // Force connect to nearest valid neighbor even if they have 4? 
                // Or just look for nearest even if already connected?
                // Let's just create points regardless of saturation if we are under-connected
                let nearest = -1
                let minD = Infinity
                for (let j = 0; j < nodes.length; j++) {
                    if (i !== j && !connections[i].has(j)) {
                        const d = nodes[i].pos.distanceTo(nodes[j].pos)
                        if (d < minD) { minD = d; nearest = j }
                    }
                }
                if (nearest !== -1) {
                    connections[i].add(nearest)
                    connections[nearest].add(i)
                }
            }
        }

        // 2. Generate Arc Geometry from unique edges
        const processed = new Set<string>()

        connections.forEach((neighbors, i) => {
            neighbors.forEach(j => {
                const key = i < j ? `${i}-${j}` : `${j}-${i}`
                if (processed.has(key)) return
                processed.add(key)

                const start = nodes[i].pos
                const end = nodes[j].pos

                for (let k = 0; k < SEGMENTS; k++) {
                    const t1 = k / SEGMENTS
                    const t2 = (k + 1) / SEGMENTS

                    const p1 = new THREE.Vector3().lerpVectors(start, end, t1).normalize().multiplyScalar(EARTH_RADIUS)
                    const p2 = new THREE.Vector3().lerpVectors(start, end, t2).normalize().multiplyScalar(EARTH_RADIUS)

                    points.push(p1)
                    points.push(p2)
                }
            })
        })

        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        return geometry
    }, [nodes])

    // Signal particles moving from Brain (0,0,0) to random nodes
    const signals = useMemo(() => {
        const arr = new Array(5).fill(0).map(() => ({
            targetIndex: Math.floor(Math.random() * nodes.length),
            progress: Math.random(),
            speed: 0.005 + Math.random() * 0.01
        }))
        return arr
    }, [nodes])

    const signalMeshRef = useRef<THREE.InstancedMesh>(null)
    const dummy = new THREE.Object3D()

    useFrame(() => {
        if (groupRef.current) {
            // Rotate with earth
            groupRef.current.rotation.y -= 0.0005
        }

        // Update signals
        if (signalMeshRef.current && groupRef.current) {
            signals.forEach((signal, i) => {
                signal.progress += signal.speed
                if (signal.progress > 1) {
                    signal.progress = 0
                    signal.targetIndex = Math.floor(Math.random() * nodes.length)
                }

                const start = new THREE.Vector3(0, 10.5, 0) // Relative to earth center, Brain is at (0, 1.5, 0) -> 1.5 - (-9) = 10.5

                // Target the HEAD of the tower. 
                // Tower head is at local Y=0.6. The node is at EARTH_RADIUS.
                // So target = normalized(node) * (EARTH_RADIUS + 0.6)
                const nodePos = nodes[signal.targetIndex].pos
                const end = nodePos.clone().normalize().multiplyScalar(EARTH_RADIUS + 0.6)

                // Lerp position
                const currentPos = new THREE.Vector3().lerpVectors(start, end, signal.progress)

                dummy.position.copy(currentPos)
                const scale = 1 - Math.abs(signal.progress - 0.5) * 0.5 // Pulse size
                dummy.scale.set(scale, scale, scale)
                dummy.updateMatrix()

                signalMeshRef.current?.setMatrixAt(i, dummy.matrix)
            })
            signalMeshRef.current.instanceMatrix.needsUpdate = true
        }
    })

    return (
        <group position={[0, -9, 0]}>
            <group ref={groupRef}>
                {/* Nodes */}
                {nodes.map((node, i) => {
                    const up = new THREE.Vector3(0, 1, 0)
                    const normal = node.pos.clone().normalize()
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal)
                    return <BTSTower key={i} position={node.pos} quaternion={quaternion} type={node.type} delay={node.delay} />
                })}

                {/* Connections */}
                <lineSegments geometry={linesGeometry}>
                    <lineBasicMaterial color="#f9f9f9ff" transparent opacity={0.3} />
                </lineSegments>

                {/* Signals */}
                <instancedMesh ref={signalMeshRef} args={[undefined, undefined, signals.length]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </instancedMesh>
            </group>
        </group>
    )
}

function BTSTower({ position, quaternion, type, delay }: { position: THREE.Vector3, quaternion: THREE.Quaternion, type: '3G' | '4G' | '5G', delay: number }) {
    const colors = {
        '3G': { primary: '#8B8B8B', glow: '#8B8B8B' },
        '4G': { primary: '#E60012', glow: '#E60012' },
        '5G': { primary: '#FFFFFF', glow: '#FFFFFF' }
    }
    const color = colors[type]

    const waveRef1 = useRef<THREE.Mesh>(null)
    const waveRef2 = useRef<THREE.Mesh>(null)
    const waveRef3 = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        const t = state.clock.getElapsedTime() + delay

        // Animate waves
        // Using modulo to create repeated expanding waves
        if (waveRef1.current) {
            const s = (t * 2) % 4
            waveRef1.current.scale.setScalar(1 + s * 0.5)
            const m = waveRef1.current.material as THREE.MeshBasicMaterial
            m.opacity = Math.max(0, (0.5 - s / 8))
        }
        if (waveRef2.current) {
            const s = (t * 2 + 1.3) % 4
            waveRef2.current.scale.setScalar(1 + s * 0.5)
            const m = waveRef2.current.material as THREE.MeshBasicMaterial
            m.opacity = Math.max(0, (0.5 - s / 8))
        }
        if (waveRef3.current) {
            const s = (t * 2 + 2.6) % 4
            waveRef3.current.scale.setScalar(1 + s * 0.5)
            const m = waveRef3.current.material as THREE.MeshBasicMaterial
            m.opacity = Math.max(0, (0.5 - s / 8))
        }
    })

    return (
        <group position={position} quaternion={quaternion}>
            {/* Tower Base (Trapezoid/Pyramid-ish) - Adapted from SVG path */}
            {/* SVG Path: M0 0 L-8 25 L8 25 Z -> Inverted Y in 3D, so Top 0, Bottom +Y */}
            {/* We map 25 SVG units to approx 0.5 3D units */}
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.02, 0.08, 0.5, 4]} />
                <meshStandardMaterial color={color.primary} emissive={color.primary} emissiveIntensity={0.5} />
            </mesh>

            {/* Cross bars - Adapted from SVG lines */}
            <mesh position={[0, 0.15, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.12, 0.01, 0.01]} />
                <meshBasicMaterial color={color.primary} />
            </mesh>
            <mesh position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.08, 0.01, 0.01]} />
                <meshBasicMaterial color={color.primary} />
            </mesh>

            {/* Antenna Line */}
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.4, 4]} />
                <meshBasicMaterial color={color.primary} />
            </mesh>

            {/* Antenna Top Circle - Sphere in 3D */}
            <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color={color.primary} />
            </mesh>

            {/* Glow effect */}
            <pointLight position={[0, 0.7, 0]} distance={1} intensity={2} color={color.glow} />

            {/* Type Label */}
            <group position={[0, 0.95, 0]}>
                <Text
                    fontSize={0.15}
                    color={color.primary}
                    anchorX="center"
                    anchorY="middle"
                // Using default font or one available if Orbitron is loaded globally, otherwise default
                >
                    {type}
                </Text>
            </group>

            {/* Signal Waves - Adapted from motion.path */}
            <group position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh ref={waveRef1}>
                    <ringGeometry args={[0.05, 0.06, 32]} />
                    <meshBasicMaterial color={color.primary} transparent opacity={0} side={THREE.DoubleSide} />
                </mesh>
                <mesh ref={waveRef2}>
                    <ringGeometry args={[0.05, 0.06, 32]} />
                    <meshBasicMaterial color={color.primary} transparent opacity={0} side={THREE.DoubleSide} />
                </mesh>
                <mesh ref={waveRef3}>
                    <ringGeometry args={[0.05, 0.06, 32]} />
                    <meshBasicMaterial color={color.primary} transparent opacity={0} side={THREE.DoubleSide} />
                </mesh>
            </group>
        </group>
    )
}
