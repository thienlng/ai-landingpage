'use client'

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'

// Premium "tech landing page" palette:
// - neutral base (hardware look) + restrained accents that match the dark/red UI
const COLORS = {
    // Brand (Viettel-ish)
    brandRed: '#E60012',
    brandRedSoft: '#FF3344',
    brandRedDark: '#B8000F',

    // Neutral tech tones (cool grays)
    baseWire: '#BFC8D6',   // wireframe/core default
    baseFill: '#6B768A',   // inner core default

    // Accents (kept cohesive, not overly saturated)
    accentCyan: '#26D6FF',
    accentBlue: '#5FA8FF',
    accentAmber: '#FF9F2F',
    accentViolet: '#A78BFA',
    accentEmerald: '#34D399'
}

const APPS = [
    { 
        name: 'Virtual Assistant', 
        description: 'Virtual Assistant for Technical Forces. This virtual assistant leverages LLM and domain-specific knowledge to support real-time Q&A, troubleshooting, and field technical support for technical staff.',
        color: COLORS.baseWire,
        accentColor: COLORS.accentCyan,
        radius: 4.2, 
        speed: 0.11, 
        yOffset: 0.6 
    },
    { 
        name: 'Disaster Resilience', 
        description: 'AI-Powered Disaster Resilience. This AI application analyzes weather, hydrological, and network data to predict risks, assisting in decision-making for protecting infrastructure and ensuring communication during natural disasters.',
        color: COLORS.baseWire,
        accentColor: COLORS.brandRedSoft,
        radius: 5.0, 
        speed: 0.12, 
        yOffset: -0.7 
    },
    { 
        name: 'Cell Power Saving', 
        description: '4G/5G Cell Power Saving. This AI solution optimizes RAN energy consumption, using load forecasting and optimization algorithms to control cell activation/deactivation, carrier management, and network parameters, balancing QoS and energy consumption.',
        color: COLORS.baseWire,
        accentColor: COLORS.accentAmber,
        radius: 3.6, 
        speed: 0.15, 
        yOffset: 0.1 
    },
    { 
        name: 'NOCPRO 5', 
        description: 'Network Monitoring and Operation Control System (NOCPRO 5). A centralized network monitoring and management platform, integrated with AI to correlate alerts, detect anomalies, and support proactive operations.',
        color: COLORS.baseWire,
        accentColor: COLORS.accentViolet,
        radius: 4.5, 
        speed: 0.10, 
        yOffset: 0.9 
    },
    { 
        name: 'vDCIM', 
        description: 'Data Center Infrastructure Management (vDCIM). An AI-based solution for managing data center infrastructure, monitoring IT and electromechanical resources, and optimizing energy, performance, and system availability.',
        color: COLORS.baseWire,
        accentColor: COLORS.accentEmerald,
        radius: 4.8, 
        speed: 0.09, 
        yOffset: -0.5 
    },
    { 
        name: 'Codev', 
        description: 'Coding Assistant (Codev). An AI assistant that supports software development and operations, including code generation, log analysis, root cause analysis, and providing bug-fixing suggestions for network and IT systems.',
        color: COLORS.baseWire,
        accentColor: COLORS.accentBlue,
        radius: 3.9, 
        speed: 0.13, 
        yOffset: 0.3 
    },
    { 
        name: 'Vsmart', 
        description: 'BTS Infrastructure and Devices Quality Management (Vsmart). A system for monitoring and assessing the quality of BTS stations and network devices, utilizing AI to detect performance degradation and provide early warnings of potential issues.',
        color: COLORS.baseWire,
        accentColor: COLORS.brandRed,
        radius: 4.1, 
        speed: 0.11, 
        yOffset: -0.3 
    },
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

function Satellite({ name, description, color, accentColor, radius, speed, yOffset, initialAngle }: { 
    name: string
    description: string
    color: string
    accentColor: string
    radius: number
    speed: number
    yOffset: number
    initialAngle: number 
}) {
    const groupRef = useRef<THREE.Group>(null)
    const coreRef = useRef<THREE.Mesh>(null)
    const ringRef = useRef<THREE.Mesh>(null)
    const textRef = useRef<THREE.Group>(null)
    const [hovered, setHovered] = useState(false)

    // Refs for pause/resume functionality
    const timeOffsetRef = useRef(0) // Accumulated pause duration
    const pauseStartTimeRef = useRef<number | null>(null) // When pause started

    // Random rotation axis for the core
    const rotationAxis = useMemo(() => new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), [])
    
    // Glow particles positions
    const glowParticles = useMemo(() => {
        return new Float32Array(Array.from({ length: 60 }, () => (Math.random() - 0.5) * 0.8))
    }, [])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        
        let effectiveTime: number
        
        // Handle pause/resume logic for orbital motion
        if (hovered) {
            // If just started hovering, record the pause start time
            if (pauseStartTimeRef.current === null) {
                pauseStartTimeRef.current = t
            }
            // Use the frozen time (time when pause started minus accumulated offset)
            effectiveTime = pauseStartTimeRef.current - timeOffsetRef.current
        } else {
            // If just stopped hovering, update the time offset
            if (pauseStartTimeRef.current !== null) {
                // Add the pause duration to the offset
                timeOffsetRef.current += t - pauseStartTimeRef.current
                pauseStartTimeRef.current = null
            }
            // Use adjusted time (current time minus accumulated pause duration)
            effectiveTime = t - timeOffsetRef.current
        }
        
        const angle = effectiveTime * speed + initialAngle
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        // Orbital motion - uses effectiveTime for smooth pause/resume
        if (groupRef.current) {
            groupRef.current.position.set(x, yOffset + Math.sin(effectiveTime * 1.5) * 0.2, z)
        }

        // Self rotation - continues even when hovered for visual feedback
        if (coreRef.current) {
            coreRef.current.rotateOnAxis(rotationAxis, hovered ? 0.005 : 0.02)
        }

        // Ring rotation - slows down when hovered
        if (ringRef.current) {
            if (!hovered) {
                ringRef.current.rotation.x = Math.sin(effectiveTime) * 0.5
                ringRef.current.rotation.y = effectiveTime * 2
            }
        }

        // Text Billboard
        if (textRef.current) {
            textRef.current.lookAt(state.camera.position)
        }
    })

    return (
        <group 
            ref={groupRef}
        >
            {/* Invisible larger mesh for easier hover detection */}
            <mesh
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <sphereGeometry args={[0.6, 16, 16]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {/* Core Tech Node - Enhanced with accent color */}
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[0.2, 0]} />
                <meshBasicMaterial
                    color={hovered ? accentColor : color}
                    wireframe
                    transparent
                    opacity={hovered ? 1 : 0.8}
                />
            </mesh>

            {/* Inner Solid Core - Gradient effect */}
            <mesh>
                <icosahedronGeometry args={[0.1, 0]} />
                <meshBasicMaterial 
                    color={hovered ? accentColor : COLORS.baseFill} 
                    transparent 
                    opacity={hovered ? 0.6 : 0.4} 
                />
            </mesh>

            {/* Additional accent ring */}
            <mesh rotation={[0, 0, Math.PI / 4]}>
                <torusGeometry args={[0.25, 0.003, 8, 32]} />
                <meshBasicMaterial 
                    color={accentColor} 
                    transparent 
                    opacity={hovered ? 0.8 : 0.4} 
                />
            </mesh>

            {/* Orbiting Ring */}
            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.3, 0.005, 8, 32]} />
                <meshBasicMaterial 
                    color={hovered ? accentColor : color} 
                    transparent 
                    opacity={hovered ? 0.9 : 0.6} 
                />
            </mesh>

            {/* Glow particles around satellite */}
            {hovered && (
                <points>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={20}
                            array={glowParticles}
                            itemSize={3}
                            args={[glowParticles, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        color={accentColor}
                        size={0.05}
                        transparent
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                    />
                </points>
            )}

            {/* Label */}
            <group ref={textRef} position={[0, 0.4, 0]}>
                <Text
                    fontSize={0.15}
                    color={hovered ? accentColor : "white"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.01}
                    outlineColor="#000000"
                >
                    {name}
                </Text>
            </group>

            {/* Hover Info Box - Positioned to the right */}
            {hovered && (
                <Html
                    position={[0.8, 0.2, 0]}
                    center
                    distanceFactor={8}
                    style={{ 
                        pointerEvents: 'none',
                        transform: 'translateX(0)',
                    }}
                >
                    <div 
                        className="satellite-hover-box"
                        style={{ '--accent-color': accentColor } as React.CSSProperties}
                    >
                        {/* Tech scanline effect */}
                        <div className="tech-scanline" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}></div>
                        
                        {/* Circuit decoration */}
                        <div className="satellite-hover-circuit" style={{ '--accent-color': accentColor } as React.CSSProperties}></div>
                        
                        <div className="satellite-hover-header">
                            <h3 className="satellite-hover-title">{name}</h3>
                        </div>
                        <div className="satellite-hover-content">
                            <p className="satellite-hover-description">{description}</p>
                        </div>
                        
                        {/* Data flow dots */}
                        <div className="satellite-hover-data-dots" style={{ '--accent-color': accentColor } as React.CSSProperties}>
                            <span style={{ background: accentColor }}></span>
                            <span style={{ background: accentColor }}></span>
                            <span style={{ background: accentColor }}></span>
                        </div>
                        
                        {/* Accent bar */}
                        <div className="satellite-hover-accent" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}></div>
                    </div>
                </Html>
            )}
        </group>
    )
}
