'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

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

        // We want nodes on the "upper" part. 
        // In the original code, we filtered y > 1.5 with Radius 6.5.
        // Center is 0,-9,0. Radius 6.5. Top is at 0,-2.5,0.
        // If we want them visible on top, let's distribute them on the top cap.

        for (let i = 0; i < NODE_COUNT; i++) {
            const lon = ga * i;
            // Distribute lat from 0 (top) down to some angle.
            // i goes 0..NODE_COUNT.
            // To be on top cap, z (local up) should be close to 1.
            // Let's use 1 - (i / (NODE_COUNT - 1)) * coverage
            const lat = Math.asin(-1 + 2 * i / (NODE_COUNT * 2 + 1)); // This is full sphere

            // Better customized approach for cap:
            // We want points distributed around the "Pole" of the sphere which is Y axis in world.
            // But let's stick to the fibonacci spiral on a sphere and just pick the ones we want?
            // Actually, for fixed count on a cap, we can just map the index range.

            // i / (NODE_COUNT-1) from 0 to 1.
            const t = i / (NODE_COUNT - 1)
            const inclination = Math.acos(1 - 0.4 * t) // 0.4 covers top ~20% of sphere surface area (cap)
            const azimuth = 2 * Math.PI * phi * i

            const x = EARTH_RADIUS * Math.sin(inclination) * Math.cos(azimuth)
            const y = EARTH_RADIUS * Math.cos(inclination) // This is local Y (up)
            const z = EARTH_RADIUS * Math.sin(inclination) * Math.sin(azimuth)

            temp.push(new THREE.Vector3(x, y, z))
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
                    potential.push({ id: j, dist: nodes[i].distanceTo(nodes[j]) })
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
                        const d = nodes[i].distanceTo(nodes[j])
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

                const start = nodes[i]
                const end = nodes[j]

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
                const nodePos = nodes[signal.targetIndex]
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
                {nodes.map((pos, i) => {
                    const up = new THREE.Vector3(0, 1, 0)
                    const normal = pos.clone().normalize()
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal)
                    return <Tower key={i} position={pos} quaternion={quaternion} />
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

function Tower({ position, quaternion }: { position: THREE.Vector3, quaternion: THREE.Quaternion }) {
    const waveRef = useRef<THREE.Mesh>(null)
    const waveRef2 = useRef<THREE.Mesh>(null)
    const waveRef3 = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        if (waveRef.current) {
            const scale = (t * 2) % 4
            waveRef.current.scale.setScalar(1 + scale)
            const material = waveRef.current.material as THREE.MeshBasicMaterial
            material.opacity = Math.max(0, 0.8 - scale / 4)
        }
        if (waveRef2.current) {
            const scale = ((t * 2) + 1.3) % 4
            waveRef2.current.scale.setScalar(1 + scale)
            const material = waveRef2.current.material as THREE.MeshBasicMaterial
            material.opacity = Math.max(0, 0.8 - scale / 4)
        }
        if (waveRef3.current) {
            const scale = ((t * 2) + 2.6) % 4
            waveRef3.current.scale.setScalar(1 + scale)
            const material = waveRef3.current.material as THREE.MeshBasicMaterial
            material.opacity = Math.max(0, 0.8 - scale / 4)
        }
    })

    return (
        <group position={position} quaternion={quaternion}>
            {/* Realistic Lattice Tower Approximation */}

            {/* Segment 1: Base (Red) */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.08, 0.12, 0.2, 4]} />
                <meshBasicMaterial color="#EE0033" />
            </mesh>

            {/* Segment 2: White */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 0.2, 4]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Segment 3: Red */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.04, 0.06, 0.2, 4]} />
                <meshBasicMaterial color="#EE0033" />
            </mesh>

            {/* Segment 4: Top White Spire */}
            <mesh position={[0, 0.7, 0]}>
                <cylinderGeometry args={[0.01, 0.04, 0.2, 4]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Platform 1 */}
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.01, 8]} />
                <meshBasicMaterial color="#444" />
            </mesh>

            {/* Antennas on Platform */}
            <group position={[0, 0.55, 0]}>
                {[0, 1, 2].map(i => (
                    <mesh key={i} position={[0.07, 0.08, 0]} rotation={[0, i * (Math.PI * 2 / 3), 0]}>
                        <boxGeometry args={[0.02, 0.12, 0.01]} />
                        <meshBasicMaterial color="#EE0033" />
                    </mesh>
                ))}
                <group rotation={[0, Math.PI, 0]}>
                    <mesh position={[0.07, 0.08, 0]}>
                        <boxGeometry args={[0.02, 0.12, 0.01]} />
                        <meshBasicMaterial color="#EE0033" />
                    </mesh>
                    <mesh position={[-0.04, 0.08, 0.06]}>
                        <boxGeometry args={[0.02, 0.12, 0.01]} />
                        <meshBasicMaterial color="#EE0033" />
                    </mesh>
                    <mesh position={[-0.04, 0.08, -0.06]}>
                        <boxGeometry args={[0.02, 0.12, 0.01]} />
                        <meshBasicMaterial color="#EE0033" />
                    </mesh>
                </group>
            </group>

            {/* Wave Signals - Emitting from platform */}
            <group position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh ref={waveRef}>
                    <ringGeometry args={[0.1, 0.12, 16]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} />
                </mesh>
                <mesh ref={waveRef2}>
                    <ringGeometry args={[0.1, 0.12, 16]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} />
                </mesh>
                <mesh ref={waveRef3}>
                    <ringGeometry args={[0.1, 0.12, 16]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} />
                </mesh>
            </group>
        </group>
    )
}
