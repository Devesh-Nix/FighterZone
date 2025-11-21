import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { useFightingGame } from "@/lib/stores/useFightingGame";
import { useSocket } from "@/lib/useSocket";
import { useAudio } from "@/lib/stores/useAudio";
import * as THREE from "three";

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  jump = "jump",
  crouch = "crouch",
  punch = "punch",
  kick = "kick",
  block = "block",
}

export function PlayerController() {
  const [, getKeys] = useKeyboardControls<Controls>();
  const { localPlayerId, players, gamePhase } = useFightingGame();
  const { sendPlayerUpdate, sendAttack, confirmHit } = useSocket();
  const { playHit } = useAudio();
  
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const isGroundedRef = useRef(true);
  const lastAttackTimeRef = useRef(0);

  useFrame((state, delta) => {
    if (!localPlayerId || gamePhase !== "fighting") return;

    const player = players.get(localPlayerId);
    if (!player) return;

    const keys = getKeys();
    const currentTime = state.clock.getElapsedTime();

    // Movement parameters
    const moveSpeed = 5;
    const jumpForce = 8;
    const gravity = -20;

    // Get current position and velocity
    const position = new THREE.Vector3(...player.position);
    const velocity = velocityRef.current;

    // Horizontal movement
    let moveX = 0;
    let moveZ = 0;

    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;
    if (keys.forward) moveZ -= 1;
    if (keys.back) moveZ += 1;

    // Normalize diagonal movement
    if (moveX !== 0 || moveZ !== 0) {
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= length;
      moveZ /= length;
    }

    velocity.x = moveX * moveSpeed;
    velocity.z = moveZ * moveSpeed;

    // Jump
    if (keys.jump && isGroundedRef.current) {
      velocity.y = jumpForce;
      isGroundedRef.current = false;
    }

    // Apply gravity
    if (!isGroundedRef.current) {
      velocity.y += gravity * delta;
    }

    // Update position
    position.x += velocity.x * delta;
    position.y += velocity.y * delta;
    position.z += velocity.z * delta;

    // Ground collision
    if (position.y <= 0) {
      position.y = 0;
      velocity.y = 0;
      isGroundedRef.current = true;
    }

    // Arena boundaries
    position.x = THREE.MathUtils.clamp(position.x, -9, 9);
    position.z = THREE.MathUtils.clamp(position.z, -6, 6);

    // Update rotation based on opponent position
    const opponent = Array.from(players.values()).find(p => p.id !== localPlayerId);
    if (opponent) {
      const opponentPos = new THREE.Vector3(...opponent.position);
      const direction = new THREE.Vector3().subVectors(opponentPos, position);
      const angle = Math.atan2(direction.x, direction.z);
      
      useFightingGame.getState().updatePlayer(localPlayerId, {
        rotation: angle,
      });
    }

    // Combat
    const attackCooldown = 0.5;
    const canAttack = currentTime - lastAttackTimeRef.current > attackCooldown;

    if (keys.block) {
      useFightingGame.getState().updatePlayer(localPlayerId, {
        isBlocking: true,
      });
    } else {
      useFightingGame.getState().updatePlayer(localPlayerId, {
        isBlocking: false,
      });
    }

    if (canAttack) {
      if (keys.punch) {
        performAttack("punch", 10, 1.5);
        lastAttackTimeRef.current = currentTime;
      } else if (keys.kick) {
        performAttack("kick", 15, 2);
        lastAttackTimeRef.current = currentTime;
      }
    }

    // Update player state
    useFightingGame.getState().updatePlayer(localPlayerId, {
      position: [position.x, position.y, position.z],
      velocity: [velocity.x, velocity.y, velocity.z],
    });

    // Send update to server less frequently
    if (currentTime % 0.05 < delta) {
      sendPlayerUpdate({
        position: [position.x, position.y, position.z],
        velocity: [velocity.x, velocity.y, velocity.z],
        isBlocking: keys.block,
      });
    }
  });

  const performAttack = (attackType: string, damage: number, range: number) => {
    if (!localPlayerId) return;

    const player = players.get(localPlayerId);
    if (!player) return;

    // Update local state
    useFightingGame.getState().updatePlayer(localPlayerId, {
      isAttacking: true,
      attackType,
    });

    // Send attack to server
    sendAttack(attackType, { damage, range });

    // Play hit sound
    playHit();

    // Check for hit on opponent
    const opponent = Array.from(players.values()).find(p => p.id !== localPlayerId);
    if (opponent) {
      const playerPos = new THREE.Vector3(...player.position);
      const opponentPos = new THREE.Vector3(...opponent.position);
      const distance = playerPos.distanceTo(opponentPos);

      if (distance <= range) {
        // Hit landed!
        if (!opponent.isBlocking) {
          confirmHit(opponent.id, damage);
          console.log(`${attackType} hit! Damage: ${damage}`);
        } else {
          // Blocked - reduced damage
          confirmHit(opponent.id, Math.floor(damage * 0.3));
          console.log(`${attackType} blocked! Reduced damage: ${Math.floor(damage * 0.3)}`);
        }
      }
    }

    // Reset attack state after animation
    setTimeout(() => {
      useFightingGame.getState().updatePlayer(localPlayerId, {
        isAttacking: false,
        attackType: null,
      });
    }, 400);
  };

  return null;
}
