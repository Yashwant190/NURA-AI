import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Box, Torus, Float } from '@react-three/drei';
import * as THREE from 'three';
import { AgentStatus } from '../types';

interface NurseAvatarProps {
  status: AgentStatus;
}

const NurseAvatar: React.FC<NurseAvatarProps> = ({ status }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  // Status-based colors
  const colors = {
    idle: '#0ea5e9', // Sky Blue
    listening: '#a855f7', // Purple
    thinking: '#eab308', // Yellow/Gold
    speaking: '#22c55e', // Green
  };

  const activeColor = colors[status];
  const isSpeaking = status === 'speaking';
  
  // Blink state
  const [blink, setBlink] = useState(false);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Random blinking
    if (Math.random() > 0.995) setBlink(true);
    if (blink && Math.random() > 0.9) setBlink(false);

    // Head movement
    if (headRef.current) {
      // Gentle floating head independent of body
      headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      headRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
      
      // Look at mouse/center slightly (simulated)
      if (status === 'listening') {
        headRef.current.rotation.y = Math.sin(time * 1) * 0.2;
      }
    }

    // Holographic Ring Animation
    if (ringRef.current) {
      ringRef.current.rotation.z -= 0.01;
      ringRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }
    
    // Group floating handled by <Float> wrapper
  });

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.3,
    metalness: 0.1,
  });

  const jointMaterial = new THREE.MeshStandardMaterial({
    color: "#334155",
    roughness: 0.7,
    metalness: 0.5,
  });

  const visorMaterial = new THREE.MeshPhysicalMaterial({
    color: "#000000",
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1,
    transparent: true,
    opacity: 0.95
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
      <group ref={groupRef} position={[0, -1, 0]}>
        
        {/* === HEAD GROUP === */}
        <group ref={headRef} position={[0, 1.6, 0]}>
          {/* Main Skull */}
          <Sphere args={[0.35, 32, 32]} material={skinMaterial} />
          
          {/* Visor / Face Area */}
          <Sphere args={[0.28, 32, 32]} position={[0, 0, 0.12]} scale={[1, 0.8, 1]} material={visorMaterial} />
          
          {/* Eyes (Glowing Strips) */}
          {!blink && (
             <group position={[0, 0, 0.34]}>
                <mesh position={[-0.08, 0.02, 0]}>
                  <planeGeometry args={[0.08, 0.02]} />
                  <meshBasicMaterial color={activeColor} toneMapped={false} />
                </mesh>
                <mesh position={[0.08, 0.02, 0]}>
                  <planeGeometry args={[0.08, 0.02]} />
                  <meshBasicMaterial color={activeColor} toneMapped={false} />
                </mesh>
             </group>
          )}

          {/* Nurse Cap */}
          <group position={[0, 0.32, 0]} rotation={[-0.2, 0, 0]}>
            {/* Cap Body */}
            <Box args={[0.4, 0.2, 0.3]} material={skinMaterial} />
            {/* Cross Symbol */}
            <group position={[0, 0, 0.16]}>
               <Box args={[0.12, 0.04, 0.01]} material={new THREE.MeshBasicMaterial({ color: activeColor })} />
               <Box args={[0.04, 0.12, 0.01]} material={new THREE.MeshBasicMaterial({ color: activeColor })} />
            </group>
          </group>

          {/* Earpieces / Audio Receptors */}
          <Cylinder args={[0.08, 0.08, 0.1]} rotation={[0, 0, Math.PI / 2]} position={[0.34, 0, 0]} material={jointMaterial} />
          <Cylinder args={[0.08, 0.08, 0.1]} rotation={[0, 0, Math.PI / 2]} position={[-0.34, 0, 0]} material={jointMaterial} />
        </group>

        {/* === NECK === */}
        <Cylinder args={[0.1, 0.1, 0.3]} position={[0, 1.25, 0]} material={jointMaterial} />

        {/* === BODY/TORSO === */}
        <group position={[0, 0.6, 0]}>
          {/* Upper Chest */}
          <Cylinder args={[0.3, 0.4, 0.8]} position={[0, 0.2, 0]} material={skinMaterial} />
          
          {/* Medical Cross on Chest */}
          <group position={[0.15, 0.3, 0.28]} rotation={[0, -0.2, 0]} scale={0.5}>
             <Box args={[0.2, 0.06, 0.01]} material={new THREE.MeshBasicMaterial({ color: '#ef4444' })} />
             <Box args={[0.06, 0.2, 0.01]} material={new THREE.MeshBasicMaterial({ color: '#ef4444' })} />
          </group>

          {/* Shoulders */}
          <Sphere args={[0.18]} position={[-0.45, 0.4, 0]} material={skinMaterial} />
          <Sphere args={[0.18]} position={[0.45, 0.4, 0]} material={skinMaterial} />

          {/* Arms (Static Pose) */}
          <Cylinder args={[0.1, 0.08, 0.7]} position={[-0.5, 0, 0]} rotation={[0, 0, 0.1]} material={skinMaterial} />
          <Cylinder args={[0.1, 0.08, 0.7]} position={[0.5, 0, 0]} rotation={[0, 0, -0.1]} material={skinMaterial} />
          
          {/* Hands */}
          <Sphere args={[0.1]} position={[-0.55, -0.4, 0]} material={jointMaterial} />
          <Sphere args={[0.1]} position={[0.55, -0.4, 0]} material={jointMaterial} />
        </group>

        {/* === HOLOGRAPHIC RING (Base) === */}
        <Torus ref={ringRef} args={[0.8, 0.02, 16, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <meshBasicMaterial color={activeColor} transparent opacity={0.3} />
        </Torus>

        {/* === STATUS LIGHT === */}
        <pointLight position={[0, 1, 0.5]} intensity={1} color={activeColor} distance={2} />
      </group>
    </Float>
  );
};

export default NurseAvatar;