import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import "@fontsource/inter";

import { useFightingGame } from "@/lib/stores/useFightingGame";
import { useSocket } from "@/lib/useSocket";
import { Menu } from "@/components/Menu";
import { CharacterSelection } from "@/components/CharacterSelection";
import { Arena } from "@/components/Arena";
import { Fighter } from "@/components/Fighter";
import { Lights } from "@/components/Lights";
import { GameUI } from "@/components/GameUI";
import { PlayerController } from "@/components/PlayerController";
import { RoundEnd } from "@/components/RoundEnd";
import { MatchEnd } from "@/components/MatchEnd";
import { SoundManager } from "@/components/SoundManager";

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

const keyMap = [
  { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
  { name: Controls.back, keys: ["KeyS", "ArrowDown"] },
  { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.jump, keys: ["Space"] },
  { name: Controls.crouch, keys: ["ShiftLeft", "ShiftRight"] },
  { name: Controls.punch, keys: ["KeyJ"] },
  { name: Controls.kick, keys: ["KeyK"] },
  { name: Controls.block, keys: ["KeyL"] },
];

function App() {
  const { gamePhase, localPlayerId, players } = useFightingGame();
  useSocket();

  useEffect(() => {
    console.log("FighterZone initialized");
  }, []);

  return (
    <KeyboardControls map={keyMap}>
      <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
        {gamePhase === "menu" && <Menu />}

        {(gamePhase === "character_selection" || gamePhase === "waiting") && <CharacterSelection />}

        {(gamePhase === "fighting" || gamePhase === "round_end" || gamePhase === "match_end") && (
          <>
            <Canvas
              shadows
              camera={{
                position: [0, 3, 12],
                fov: 50,
                near: 0.1,
                far: 1000,
              }}
              gl={{
                antialias: true,
                powerPreference: "high-performance",
              }}
            >
              <color attach="background" args={["#0a0a0a"]} />

              <Lights />

              <Suspense fallback={null}>
                <Arena />
                
                {Array.from(players.keys()).map((playerId) => (
                  <Fighter
                    key={playerId}
                    playerId={playerId}
                    isLocalPlayer={playerId === localPlayerId}
                  />
                ))}
              </Suspense>
            </Canvas>

            <GameUI />
            <PlayerController />

            {gamePhase === "round_end" && <RoundEnd />}
            {gamePhase === "match_end" && <MatchEnd />}
          </>
        )}

        <SoundManager />
      </div>
    </KeyboardControls>
  );
}

export default App;
