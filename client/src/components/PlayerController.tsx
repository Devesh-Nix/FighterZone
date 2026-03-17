import { useEffect, useRef, useState } from "react";
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
  special = "special",
}

export function PlayerController() {
  const [, getKeys] = useKeyboardControls<Controls>();
  const { localPlayerId, players, gamePhase, incrementCombo, resetCombo, addSpecialEnergy, lastHitTime } = useFightingGame();
  const { sendPlayerUpdate, sendAttack, confirmHit } = useSocket();
  const { playHit } = useAudio();
  
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const isGroundedRef = useRef(true);
  const lastAttackTimeRef = useRef(0);
  const lastHealthRef = useRef(100);
  const hitstunEndTimeRef = useRef(0);
  const [comboResetTimer, setComboResetTimer] = useState<NodeJS.Timeout | null>(null);

  // Reset combo after 2 seconds of no hits
  useEffect(() => {
    if (!localPlayerId) return;
    
    if (comboResetTimer) {
      clearTimeout(comboResetTimer);
    }
    
    const timer = setTimeout(() => {
      const player = players.get(localPlayerId);
      if (player && player.comboCount > 0) {
        resetCombo(localPlayerId);
      }
    }, 2000);
    
    setComboResetTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [lastHitTime, localPlayerId]);

  useFrame((state, delta) => {
    if (!localPlayerId || gamePhase !== "fighting") return;

    const player = players.get(localPlayerId);
    if (!player) return;

    const keys = getKeys();
    const currentTime = state.clock.getElapsedTime();

    // Check hitstun locally
    if (player.health < lastHealthRef.current) {
      hitstunEndTimeRef.current = currentTime + 0.3; // 300ms hitstun
      // apply some knockback
      const opponent = Array.from(players.values()).find(p => p.id !== localPlayerId);
      if (opponent) {
        const dir = new THREE.Vector3().subVectors(new THREE.Vector3(...player.position), new THREE.Vector3(...opponent.position)).normalize();
        velocityRef.current.x = dir.x * 10;
        velocityRef.current.z = dir.z * 10;
      }
    }
    lastHealthRef.current = player.health;

    const isHitstun = currentTime < hitstunEndTimeRef.current;
    const isAttacking = player.isAttacking;

    // Movement parameters
    const moveSpeed = 5;
    const jumpForce = 8;
    const gravity = -20;

    // Get current position and velocity
    const position = new THREE.Vector3(...player.position);
    const velocity = velocityRef.current;

    // Apply friction to x/z velocity
    velocity.x *= 0.85;
    velocity.z *= 0.85;

    if (!isHitstun && !isAttacking && isGroundedRef.current) {
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

      // Add movement to velocity rather than strictly set it to allow smooth stop/knockbacks
      velocity.x += moveX * moveSpeed * 0.2;
      velocity.z += moveZ * moveSpeed * 0.2;

      // Cap speed
      const hSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
      if (hSpeed > moveSpeed) {
        velocity.x = (velocity.x / hSpeed) * moveSpeed;
        velocity.z = (velocity.z / hSpeed) * moveSpeed;
      }
    }

    // Jump
    if (keys.jump && isGroundedRef.current && !isHitstun && !isAttacking) {
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
    let angle = player.rotation;
    if (opponent) {
      const opponentPos = new THREE.Vector3(...opponent.position);
      const direction = new THREE.Vector3().subVectors(opponentPos, position);
      angle = Math.atan2(direction.x, direction.z);
    }

    // Combat
    const canAttack = !isHitstun && !isAttacking && isGroundedRef.current;

    if (keys.block && !isHitstun && !isAttacking) {
      if (!player.isBlocking) {
        useFightingGame.getState().updatePlayer(localPlayerId, { isBlocking: true });
      }
    } else {
      if (player.isBlocking) {
        useFightingGame.getState().updatePlayer(localPlayerId, { isBlocking: false });
      }
    }

    if (canAttack) {
      if (keys.special && player.specialEnergy >= 100 && currentTime - lastAttackTimeRef.current > 1.0) {
        performSpecialMove(currentTime);
      } else if (keys.punch && currentTime - lastAttackTimeRef.current > 0.4) {
        performAttack("punch", 10, 1.8, 0.4, currentTime, Math.PI / 2.5); // Wider angle, less reach
      } else if (keys.kick && currentTime - lastAttackTimeRef.current > 0.8) {
        performAttack("kick", 15, 2.5, 0.8, currentTime, Math.PI / 4); // Narrow angle, more reach
      }
    }

    // Update player state
    useFightingGame.getState().updatePlayer(localPlayerId, {
      position: [position.x, position.y, position.z],
      velocity: [velocity.x, velocity.y, velocity.z],
      rotation: angle,
    });

    // Send update to server periodically
    if (currentTime % 0.05 < delta) {
      sendPlayerUpdate({
        position: [position.x, position.y, position.z],
        velocity: [velocity.x, velocity.y, velocity.z],
        rotation: angle,
        isBlocking: keys.block,
        comboCount: player.comboCount,
        specialEnergy: player.specialEnergy,
      });
    }
  });

  const performSpecialMove = (time: number) => {
    if (!localPlayerId) return;

    const player = players.get(localPlayerId);
    if (!player || player.specialEnergy < 100) return;

    lastAttackTimeRef.current = time;

    useFightingGame.getState().updatePlayer(localPlayerId, {
      specialEnergy: 0,
      isAttacking: true,
      attackType: "special",
    });

    const specialMoves = {
      0: { name: "Fire Punch", damage: 30, range: 4.5 },
      1: { name: "Lightning Strike", damage: 35, range: 5 },
      2: { name: "Shadow Slash", damage: 32, range: 4 },
      3: { name: "Power Slam", damage: 40, range: 3.5 },
      4: { name: "Spinning Kick", damage: 28, range: 4.5 },
      5: { name: "Elbow Strike", damage: 33, range: 4 },
    };

    const special = specialMoves[player.characterId as keyof typeof specialMoves] || specialMoves[0];

    sendAttack(`special_${special.name}`, { damage: special.damage, range: special.range });
    playHit();

    // Startup frames for special
    setTimeout(() => {
      const currentState = useFightingGame.getState();
      const p = currentState.players.get(localPlayerId);
      if (!p) return;
      
      const opponent = Array.from(currentState.players.values()).find(p => p.id !== localPlayerId);
      if (opponent) {
        const playerPos = new THREE.Vector3(...p.position);
        const opponentPos = new THREE.Vector3(...opponent.position);
        const distance = playerPos.distanceTo(opponentPos);

        if (distance <= special.range) {
          const finalDamage = opponent.isBlocking ? Math.floor(special.damage * 0.5) : special.damage;
          confirmHit(opponent.id, finalDamage);
          resetCombo(localPlayerId);
          console.log(`${special.name} SPECIAL HIT!`);
        }
      }
    }, 200); // 200ms startup

    setTimeout(() => {
      useFightingGame.getState().updatePlayer(localPlayerId, {
        isAttacking: false,
        attackType: null,
      });
    }, 800);
  };

  const performAttack = (attackType: string, damage: number, range: number, duration: number, time: number, hitAngle: number) => {
    if (!localPlayerId) return;

    const player = players.get(localPlayerId);
    if (!player) return;

    lastAttackTimeRef.current = time;

    useFightingGame.getState().updatePlayer(localPlayerId, {
      isAttacking: true,
      attackType,
    });

    sendAttack(attackType, { damage, range });
    playHit();

    // Hit detection with startup frames (100ms)
    setTimeout(() => {
      const currentState = useFightingGame.getState();
      const p = currentState.players.get(localPlayerId);
      if (!p) return;

      const opponent = Array.from(currentState.players.values()).find(op => op.id !== localPlayerId);
      if (opponent) {
        const playerPos = new THREE.Vector3(...p.position);
        const opponentPos = new THREE.Vector3(...opponent.position);
        const distance = Math.sqrt(
          Math.pow(opponentPos.x - playerPos.x, 2) + Math.pow(opponentPos.z - playerPos.z, 2)
        );

        // Direction check
        const dir = new THREE.Vector3().subVectors(opponentPos, playerPos).normalize();
        const faceMult = new THREE.Vector3(Math.sin(p.rotation), 0, Math.cos(p.rotation));
        const angleDiff = Math.acos(THREE.MathUtils.clamp(dir.dot(faceMult), -1, 1));

        if (distance <= range && angleDiff <= hitAngle) {
          if (!opponent.isBlocking) {
            confirmHit(opponent.id, damage);
            incrementCombo(localPlayerId);
            addSpecialEnergy(localPlayerId, 10);
          } else {
            const reducedDamage = Math.floor(damage * 0.3);
            confirmHit(opponent.id, reducedDamage);
            addSpecialEnergy(localPlayerId, 3);
          }
        }
      }
    }, 100);

    setTimeout(() => {
      useFightingGame.getState().updatePlayer(localPlayerId, {
        isAttacking: false,
        attackType: null,
      });
    }, duration * 1000);
  };

  return null;
}
