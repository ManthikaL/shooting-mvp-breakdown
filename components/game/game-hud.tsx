"use client"

import { useState, useEffect, useRef } from "react"
import { Crosshair } from "lucide-react"

export function GameHUD({ isPaused }: { isPaused: boolean }) {
  const [health, setHealth] = useState(100)
  const [ammo, setAmmo] = useState(30)
  const [reserveAmmo, setReserveAmmo] = useState(90)
  const [kills, setKills] = useState(0)
  const [deaths, setDeaths] = useState(0)
  const [matchTime, setMatchTime] = useState(300)
  const [matchEnded, setMatchEnded] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleAmmoUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      setAmmo(customEvent.detail.ammo)
      setReserveAmmo(customEvent.detail.reserve)
    }

    const handlePlayerStatsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      setHealth(customEvent.detail.health)
      setKills(customEvent.detail.kills)
      setDeaths(customEvent.detail.deaths)
    }

    const handleRestart = () => {
      setHealth(100)
      setAmmo(30)
      setReserveAmmo(90)
      setKills(0)
      setDeaths(0)
      setMatchTime(300)
      setMatchEnded(false)
    }

    window.addEventListener("ammoUpdate", handleAmmoUpdate)
    window.addEventListener("playerStatsUpdate", handlePlayerStatsUpdate)
    window.addEventListener("restartMatch", handleRestart)

    return () => {
      window.removeEventListener("ammoUpdate", handleAmmoUpdate)
      window.removeEventListener("playerStatsUpdate", handlePlayerStatsUpdate)
      window.removeEventListener("restartMatch", handleRestart)
    }
  }, [])

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }

    if (!isPaused && !matchEnded && matchTime > 0) {
      timerIntervalRef.current = setInterval(() => {
        setMatchTime((prev) => {
          const newTime = Math.max(0, prev - 1)
          if (newTime === 0 && !matchEnded) {
            setMatchEnded(true)
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("matchEnd", {
                  detail: { kills, deaths, time: 300 },
                }),
              )
            }, 100)
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [isPaused, matchEnded, matchTime, kills, deaths])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <Crosshair className="w-6 h-6 text-cyan-500" strokeWidth={2} />
      </div>

      {/* Health Bar */}
      <div className="absolute bottom-8 left-8 space-y-2">
        <div className="text-white font-mono text-sm">HP</div>
        <div className="w-48 h-3 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all"
            style={{ width: `${health}%` }}
          />
        </div>
        <div className="text-white font-mono text-xl font-bold">{health}</div>
      </div>

      {/* Ammo Counter */}
      <div className="absolute bottom-8 right-8 text-right">
        <div className="text-white font-mono text-sm text-zinc-400">AMMO</div>
        <div className={`font-mono text-4xl font-bold ${ammo === 0 ? "text-red-500" : "text-white"}`}>{ammo}</div>
        <div className="text-zinc-400 font-mono text-sm">/ {reserveAmmo}</div>
      </div>

      {/* Kill/Death Counter */}
      <div className="absolute top-8 left-8 bg-black/50 border border-zinc-800 rounded px-4 py-2">
        <div className="flex gap-6 text-white font-mono">
          <div>
            <span className="text-cyan-500">K:</span> {kills}
          </div>
          <div>
            <span className="text-red-500">D:</span> {deaths}
          </div>
          <div>
            <span className="text-zinc-400">KD:</span> {deaths === 0 ? kills.toFixed(2) : (kills / deaths).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Match Timer */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/50 border border-zinc-800 rounded px-6 py-2">
        <div className={`font-mono text-xl font-bold ${matchTime < 60 ? "text-red-500" : "text-white"}`}>
          {formatTime(matchTime)}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-8 right-8 bg-black/50 border border-zinc-800 rounded px-4 py-3 text-sm text-zinc-400 font-mono space-y-1">
        <div>WASD - Move</div>
        <div>Space - Jump</div>
        <div>Click - Shoot</div>
        <div>R - Reload</div>
        <div>Tab - Scoreboard</div>
        <div>ESC - Pause</div>
      </div>
    </>
  )
}
