"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GameCanvas } from "@/components/game/game-canvas"
import { GameHUD } from "@/components/game/game-hud"
import { Scoreboard } from "@/components/game/scoreboard"
import { Button } from "@/components/ui/button"

export default function GamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const botsEnabled = searchParams.get("bots") === "true"
  const [isLoaded, setIsLoaded] = useState(false)
  const [showClickToPlay, setShowClickToPlay] = useState(true)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  const [showMatchEnd, setShowMatchEnd] = useState(false)
  const [matchStats, setMatchStats] = useState({ kills: 0, deaths: 0, time: 0 })
  const [gameKey, setGameKey] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    setIsLoaded(true)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault()
        setShowScoreboard(true)
      }
      if (e.key === "Escape" && !showMatchEnd) {
        e.preventDefault()
        setShowPauseMenu((prev) => !prev)
        setIsPaused((prev) => !prev)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault()
        setShowScoreboard(false)
      }
    }

    const handleMatchEnd = (e: Event) => {
      const customEvent = e as CustomEvent
      setMatchStats(customEvent.detail)
      setShowMatchEnd(true)
      setIsPaused(true)
    }

    const handlePointerLockChange = () => {
      if (document.pointerLockElement) {
        setShowClickToPlay(false)
      } else if (!showPauseMenu && !showMatchEnd) {
        setShowClickToPlay(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("matchEnd", handleMatchEnd)
    document.addEventListener("pointerlockchange", handlePointerLockChange)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("matchEnd", handleMatchEnd)
      document.removeEventListener("pointerlockchange", handlePointerLockChange)
    }
  }, [showMatchEnd, showPauseMenu])

  const handleQuitMatch = () => {
    setShowPauseMenu(false)
    setShowMatchEnd(false)
    setIsPaused(false)
    router.push("/")
  }

  const handleRestartMatch = () => {
    setShowPauseMenu(false)
    setShowMatchEnd(false)
    setIsPaused(false)
    setGameKey((prev) => prev + 1)
    window.dispatchEvent(new CustomEvent("restartMatch"))
  }

  const handleContinue = () => {
    setShowMatchEnd(false)
    setIsPaused(false)
    router.push("/")
  }

  const handleClickToPlay = () => {
    // Small delay to ensure the canvas is fully mounted
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("requestPointerLock"))
    }, 100)
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <GameCanvas key={gameKey} isPaused={isPaused} botsEnabled={botsEnabled} />
      <GameHUD isPaused={isPaused} />
      {showScoreboard && <Scoreboard />}

      {showClickToPlay && !showPauseMenu && !showMatchEnd && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 cursor-pointer"
          onClick={handleClickToPlay}
        >
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-white drop-shadow-lg">Click to Play</div>
            <div className="text-xl text-cyan-500 font-mono">
              WASD to move • SPACE to jump • Mouse to aim • Click to shoot
            </div>
          </div>
        </div>
      )}

      {showPauseMenu && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border-2 border-cyan-500 rounded-lg p-8 w-96 space-y-6">
            <h2 className="text-4xl font-bold text-white text-center">Paused</h2>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowPauseMenu(false)
                  setIsPaused(false)
                }}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-6 text-lg"
              >
                Resume
              </Button>
              <Button onClick={handleRestartMatch} variant="outline" className="w-full py-6 text-lg bg-transparent">
                Restart Match
              </Button>
              <Button
                onClick={handleQuitMatch}
                variant="outline"
                className="w-full py-6 text-lg border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
              >
                Quit Match
              </Button>
            </div>
          </div>
        </div>
      )}

      {showMatchEnd && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border-2 border-cyan-500 rounded-lg p-8 w-96 space-y-6">
            <h2 className="text-4xl font-bold text-white text-center">Match Summary</h2>
            <div className="space-y-4 text-white font-mono">
              <div className="flex justify-between items-center border-b border-zinc-700 pb-2">
                <span className="text-zinc-400">Time Played:</span>
                <span className="text-xl font-bold">
                  {Math.floor(matchStats.time / 60)}:{(matchStats.time % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700 pb-2">
                <span className="text-zinc-400">Kills:</span>
                <span className="text-2xl font-bold text-cyan-500">{matchStats.kills}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700 pb-2">
                <span className="text-zinc-400">Deaths:</span>
                <span className="text-2xl font-bold text-red-500">{matchStats.deaths}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">K/D Ratio:</span>
                <span className="text-xl font-bold">
                  {matchStats.deaths === 0
                    ? matchStats.kills.toFixed(2)
                    : (matchStats.kills / matchStats.deaths).toFixed(2)}
                </span>
              </div>
            </div>
            <Button
              onClick={handleContinue}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-6 text-lg"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
