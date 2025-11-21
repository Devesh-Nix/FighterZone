import { useTexture, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useFightingGame } from "@/lib/stores/useFightingGame";
import { useMemo } from "react";

function ClassicArena() {
  const woodTexture = useTexture("/textures/wood.jpg");
  
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(10, 10);

  return (
    <group>
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[20, 1, 15]} />
        <meshStandardMaterial map={woodTexture} />
      </mesh>
      <mesh position={[-10.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 16]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[10.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 16]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 14]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 2, -8]} receiveShadow>
        <boxGeometry args={[22, 6, 0.5]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

function DojoArena() {
  const scene = useMemo(() => {
    try {
      const { scene } = useGLTF("/models/arena_dojo.glb");
      return scene.clone();
    } catch {
      return null;
    }
  }, []);

  return (
    <group>
      {scene && <primitive object={scene} scale={1} position={[0, -0.5, 0]} />}
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[20, 1, 15]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[-10.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 16]} />
        <meshStandardMaterial color="#8B0000" />
      </mesh>
      <mesh position={[10.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 16]} />
        <meshStandardMaterial color="#8B0000" />
      </mesh>
      <mesh position={[0, 2, -8]} receiveShadow>
        <boxGeometry args={[22, 6, 0.5]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  );
}

function CyberArena() {
  const scene = useMemo(() => {
    try {
      const { scene } = useGLTF("/models/arena_cyber.glb");
      return scene.clone();
    } catch {
      return null;
    }
  }, []);

  return (
    <group>
      {scene && <primitive object={scene} scale={1} position={[0, -0.5, 0]} />}
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[20, 1, 15]} />
        <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.2} emissive="#00ffff" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[-10.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[10.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 16]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 14]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 2, -8]} receiveShadow>
        <boxGeometry args={[22, 6, 0.5]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.3} />
      </mesh>
      <pointLight position={[-8, 3, 0]} color="#00ffff" intensity={0.5} />
      <pointLight position={[8, 3, 0]} color="#ff00ff" intensity={0.5} />
    </group>
  );
}

export function Arena() {
  const { selectedArena } = useFightingGame();

  return (
    <>
      {/* Arena boundaries - invisible walls */}
      <mesh position={[-10, 1, 0]} visible={false}>
        <boxGeometry args={[0.5, 4, 15]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh position={[10, 1, 0]} visible={false}>
        <boxGeometry args={[0.5, 4, 15]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh position={[0, 1, -7.5]} visible={false}>
        <boxGeometry args={[20, 4, 0.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh position={[0, 1, 7.5]} visible={false}>
        <boxGeometry args={[20, 4, 0.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {selectedArena === 0 && <ClassicArena />}
      {selectedArena === 1 && <DojoArena />}
      {selectedArena === 2 && <CyberArena />}
    </>
  );
}
