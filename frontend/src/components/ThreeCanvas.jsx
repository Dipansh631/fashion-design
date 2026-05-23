import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles, Trail, Stars } from '@react-three/drei'
import * as THREE from 'three'

// ─── Floating Diamond Gem ──────────────────────────────────────────────────
const DiamondGem = ({ position, color, scale = 1, speed = 1 }) => {
  const mesh = useRef()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed
    mesh.current.rotation.y = t * 0.8
    mesh.current.rotation.x = Math.sin(t * 0.4) * 0.3
    mesh.current.position.y = position[1] + Math.sin(t * 0.6) * 0.4
  })
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.8}>
      <mesh ref={mesh} position={position} scale={scale}>
        <octahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.9}
          roughness={0.05}
          reflectivity={1}
          transparent
          opacity={0.85}
          envMapIntensity={2}
        />
      </mesh>
    </Float>
  )
}

// ─── Orbiting Ribbon Arc ───────────────────────────────────────────────────
const RibbonRing = ({ radius = 3, color, offset = 0, speed = 0.4, tubeRadius = 0.04 }) => {
  const mesh = useRef()
  const curve = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Math.PI * 2
      const wave = Math.sin(t * 5 + offset) * 0.3
      pts.push(new THREE.Vector3(
        Math.cos(t) * (radius + wave),
        Math.sin(t * 2.5) * 1.2,
        Math.sin(t) * (radius + wave)
      ))
    }
    return new THREE.CatmullRomCurve3(pts, true)
  }, [radius, offset])

  useFrame(({ clock }) => {
    mesh.current.rotation.y = clock.getElapsedTime() * speed
    mesh.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.15
  })

  return (
    <mesh ref={mesh}>
      <tubeGeometry args={[curve, 200, tubeRadius, 8, true]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        metalness={0.8}
        roughness={0.1}
        transparent
        opacity={0.75}
      />
    </mesh>
  )
}

// ─── Dress Silhouette Wireframe ─────────────────────────────────────────────
const DressSilhouette = ({ position = [0, 0, 0], speed = 0.3 }) => {
  const group = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed
    group.current.rotation.y = t * 0.4
    group.current.position.y = position[1] + Math.sin(t * 0.5) * 0.3
  })

  // Bodice (top half - tapered box)
  // Skirt (bottom - cone)
  return (
    <group ref={group} position={position}>
      {/* Bodice */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.35, 0.55, 1.0, 8, 1, true]} />
        <meshStandardMaterial
          color="#d4af37"
          emissive="#b8963e"
          emissiveIntensity={0.4}
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Waist accent */}
      <mesh position={[0, 0.38, 0]}>
        <torusGeometry args={[0.55, 0.04, 8, 40]} />
        <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={1} />
      </mesh>
      {/* Skirt */}
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[1.6, 1.8, 16, 4, true]} />
        <meshStandardMaterial
          color="#6b46c1"
          emissive="#6b46c1"
          emissiveIntensity={0.35}
          wireframe
          transparent
          opacity={0.75}
        />
      </mesh>
      {/* Shoulder arcs */}
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[side * 0.55, 1.35, 0]} rotation={[0, 0, side * Math.PI / 4]}>
          <torusGeometry args={[0.28, 0.025, 8, 30, Math.PI]} />
          <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.9} />
        </mesh>
      ))}
      {/* Crown/head pin */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#fff" emissive="#fffacd" emissiveIntensity={1.5} />
      </mesh>
    </group>
  )
}

// ─── Floating Fabric Square (distorted cloth-like) ─────────────────────────
const FabricSquare = ({ position, color, speed = 0.5 }) => {
  return (
    <Float speed={speed} rotationIntensity={1.2} floatIntensity={1.5}>
      <mesh position={position} rotation={[0.4, 0.4, 0]}>
        <planeGeometry args={[1.5, 1.5, 16, 16]} />
        <MeshDistortMaterial
          color={color}
          speed={2}
          distort={0.6}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>
    </Float>
  )
}

// ─── Orbiting Pearl Beads ──────────────────────────────────────────────────
const PearlNecklace = ({ radius = 4.5, count = 18, color = '#f8f0e3', yPos = 1 }) => {
  const group = useRef()
  useFrame(({ clock }) => {
    group.current.rotation.y = clock.getElapsedTime() * 0.15
    group.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.08) * 0.1
  })
  return (
    <group ref={group} position={[0, yPos, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const y = Math.sin(angle * 2) * 0.5
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshPhysicalMaterial
              color={color}
              metalness={0.1}
              roughness={0.05}
              reflectivity={0.9}
              clearcoat={1}
              clearcoatRoughness={0}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── Background Star Dust ──────────────────────────────────────────────────
const BackgroundNebula = () => (
  <>
    <Stars radius={40} depth={30} count={1500} factor={3} saturation={0.8} fade speed={0.5} />
    <Sparkles
      count={120}
      scale={20}
      size={2.5}
      speed={0.3}
      color="#d4af37"
      opacity={0.7}
    />
  </>
)

// ─── Dynamic Lights ────────────────────────────────────────────────────────
const DynamicLights = () => {
  const gold = useRef()
  const purple = useRef()
  const white = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    gold.current.position.x = Math.sin(t * 0.4) * 6
    gold.current.position.z = Math.cos(t * 0.4) * 6
    purple.current.position.x = Math.cos(t * 0.3) * 5
    purple.current.position.z = Math.sin(t * 0.3) * 5
    white.current.intensity = 1.2 + Math.sin(t * 0.8) * 0.4
  })

  return (
    <>
      <ambientLight intensity={0.3} color="#1a0a2e" />
      <pointLight ref={gold} position={[5, 4, 3]} color="#d4af37" intensity={4} distance={18} />
      <pointLight ref={purple} position={[-4, 2, -4]} color="#8b5cf6" intensity={3.5} distance={16} />
      <pointLight ref={white} position={[0, 8, 0]} color="#ffffff" intensity={1.5} distance={20} />
      <spotLight position={[0, 10, 0]} angle={0.4} penumbra={0.9} intensity={2} color="#d4af37" castShadow />
    </>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────
const ThreeCanvas = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      zIndex: -1,
      background: 'radial-gradient(ellipse at 30% 20%, #1a0a2e 0%, #0a0a0a 60%, #000 100%)'
    }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 65 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <DynamicLights />
        <BackgroundNebula />

        {/* Central dress silhouette */}
        <DressSilhouette position={[0, 0.5, 0]} speed={0.25} />

        {/* Orbiting ribbons at different radii & speeds */}
        <RibbonRing radius={3.2} color="#d4af37" offset={0} speed={0.25} tubeRadius={0.045} />
        <RibbonRing radius={4.2} color="#6b46c1" offset={2} speed={-0.18} tubeRadius={0.035} />
        <RibbonRing radius={5.0} color="#ec4899" offset={4} speed={0.12} tubeRadius={0.025} />

        {/* Pearl necklace orbit */}
        <PearlNecklace radius={3.8} count={22} color="#f8f0e3" yPos={0.5} />
        <PearlNecklace radius={5.5} count={30} color="#d4af37" yPos={-0.8} />

        {/* Floating diamond gems */}
        <DiamondGem position={[-5.5, 1.5, -1]} color="#d4af37" scale={0.55} speed={0.7} />
        <DiamondGem position={[5.0, -1.0, -2]} color="#6b46c1" scale={0.7} speed={0.9} />
        <DiamondGem position={[3.5, 3.0, -3]} color="#ec4899" scale={0.4} speed={1.1} />
        <DiamondGem position={[-4.0, -2.5, -1]} color="#a78bfa" scale={0.5} speed={0.6} />
        <DiamondGem position={[0.5, 4.5, -4]} color="#fbbf24" scale={0.35} speed={1.3} />
        <DiamondGem position={[-3.0, 3.5, 1]} color="#f9a8d4" scale={0.45} speed={0.85} />

        {/* Floating fabric squares */}
        <FabricSquare position={[-6.5, 2, -3]} color="#d4af37" speed={0.6} />
        <FabricSquare position={[6.0, -1, -4]} color="#6b46c1" speed={0.45} />
        <FabricSquare position={[4.0, 3.5, -5]} color="#ec4899" speed={0.7} />
        <FabricSquare position={[-5.0, -3, -2]} color="#a78bfa" speed={0.55} />
      </Canvas>
    </div>
  )
}

export default ThreeCanvas
