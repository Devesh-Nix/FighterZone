import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useFightingGame } from "@/lib/stores/useFightingGame";
import { useRef } from "react";

export function DynamicCamera() {
  const { players, gamePhase } = useFightingGame();
  const currentLookAt = useRef(new THREE.Vector3(0, 1.5, 0));

  useFrame((state) => {
    if (gamePhase !== "fighting" && gamePhase !== "round_end" && gamePhase !== "match_end") return;
    
    const playerArray = Array.from(players.values());
    if (playerArray.length >= 2) {
      if (playerArray[0]?.position && playerArray[1]?.position) {
        const p1 = new THREE.Vector3(...playerArray[0].position);
        const p2 = new THREE.Vector3(...playerArray[1].position);

        // Midpoint
        const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        
        // Distance between players
        const distance = p1.distanceTo(p2);

        // Dynamic camera position
        const targetZ = Math.max(9, Math.min(15, distance * 0.8 + 6));
        const targetY = 3 + distance * 0.1;

        const targetPos = new THREE.Vector3(midpoint.x, targetY, targetZ); 

        // Smoothly interpolate camera position
        state.camera.position.lerp(targetPos, 0.05);

        // Smoothly interpolate lookAt
        const targetLookAt = new THREE.Vector3(midpoint.x, 1.5, 0);        
        currentLookAt.current.lerp(targetLookAt, 0.1);
        state.camera.lookAt(currentLookAt.current);
      }
    }
  });

  return null;
}
