import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export function Arena() {
  const woodTexture = useTexture("/textures/wood.jpg");
  
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(10, 10);

  return (
    <group>
      {/* Main fighting platform */}
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[20, 1, 15]} />
        <meshStandardMaterial map={woodTexture} />
      </mesh>

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

      {/* Side barriers for visual effect */}
      <mesh position={[-10.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 16]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[10.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 16]} />
        <meshStandardMaterial color="#222222" />
      </mesh>

      {/* Center line marking */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 14]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>

      {/* Background wall */}
      <mesh position={[0, 2, -8]} receiveShadow>
        <boxGeometry args={[22, 6, 0.5]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}
