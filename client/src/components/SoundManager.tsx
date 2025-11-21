import { useEffect } from "react";
import { useAudio } from "@/lib/stores/useAudio";

export function SoundManager() {
  const { setHitSound, setSuccessSound, toggleMute, isMuted } = useAudio();

  useEffect(() => {
    const hitAudio = new Audio("/sounds/hit.mp3");
    const successAudio = new Audio("/sounds/success.mp3");

    hitAudio.preload = "auto";
    successAudio.preload = "auto";

    setHitSound(hitAudio);
    setSuccessSound(successAudio);

    console.log("Sound manager initialized");
  }, [setHitSound, setSuccessSound]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleMute}
        className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg border-2 border-white/30 hover:bg-black/90 transition-colors"
      >
        {isMuted ? "🔇 Unmute" : "🔊 Mute"}
      </button>
    </div>
  );
}
