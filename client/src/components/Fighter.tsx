import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useFightingGame, PlayerData } from "@/lib/stores/useFightingGame";
import { useSocket } from "@/lib/useSocket";

interface FighterProps {
  playerId: string;
  isLocalPlayer: boolean;
}

export function Fighter({ playerId, isLocalPlayer }: FighterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { players } = useFightingGame();
  const { sendPlayerUpdate, sendAttack, confirmHit } = useSocket();
  const player = players.get(playerId);

  const [lastAttackTime, setLastAttackTime] = useState(0);

  const characterModels = [
    "/models/fighter_red.glb",
    "/models/fighter_blue.glb",
    "/models/fighter_ninja.glb",
    "/models/fighter_wrestler.glb",
    "/models/fighter_capoeira.glb",
    "/models/fighter_muaythai.glb",
  ];

  const modelPath = characterModels[player?.characterId || 0];
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  useEffect(() => {
    if (groupRef.current && player) {
      groupRef.current.position.set(...player.position);
      groupRef.current.rotation.y = player.rotation;
    }
  }, [player?.position, player?.rotation]);

  useFrame((state, delta) => {
    if (!groupRef.current || !player || !isLocalPlayer) return;

    const currentTime = state.clock.getElapsedTime();

    // Attack animation timing
    if (player.isAttacking && currentTime - lastAttackTime > 0.5) {
      const playerState = useFightingGame.getState().players.get(playerId);
      if (playerState) {
        useFightingGame.getState().updatePlayer(playerId, {
          isAttacking: false,
          attackType: null,
        });
      }
    }

    // Sync position to server periodically
    if (isLocalPlayer && currentTime % 0.1 < delta) {
      sendPlayerUpdate({
        position: [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z],
        rotation: groupRef.current.rotation.y,
      });
    }
  });

  if (!player) return null;

  return (
    <group ref={groupRef} position={player.position} rotation={[0, player.rotation, 0]}>
      <primitive object={scene.clone()} scale={2.5} />
      
      {/* Hit box for collision detection */}
      <mesh visible={false} position={[0, 1, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshBasicMaterial transparent opacity={0.3} color="red" />
      </mesh>

      {/* Blocking indicator */}
      {player.isBlocking && (
        <mesh position={[0, 1.5, 0.5]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Attack indicator */}
      {player.isAttacking && (
        <mesh position={[0, 1, player.playerNumber === 1 ? 1 : -1]}>
          <boxGeometry args={[0.5, 0.5, 1]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}
