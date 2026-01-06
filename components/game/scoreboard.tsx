"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface PlayerData {
  name: string
  kills: number
  deaths: number
  isYou?: boolean
}

export function Scoreboard() {
  const [players, setPlayers] = useState<PlayerData[]>([])

  useEffect(() => {
    const handleScoreboardData = (event: Event) => {
      const customEvent = event as CustomEvent
      const { player, bots } = customEvent.detail

      const allPlayers: PlayerData[] = [
        { name: "You", kills: player.kills, deaths: player.deaths, isYou: true },
        ...bots.map((bot: any) => ({ name: bot.name, kills: bot.kills, deaths: 0 })),
      ]

      setPlayers(allPlayers)
    }

    const requestData = () => {
      window.dispatchEvent(new Event("requestScoreboardData"))
    }

    requestData()
    const interval = setInterval(requestData, 1000)

    window.addEventListener("scoreboardData", handleScoreboardData)
    return () => {
      window.removeEventListener("scoreboardData", handleScoreboardData)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <Card className="w-full max-w-3xl bg-zinc-900 border-zinc-800">
        <div className="p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Free For All</h2>
            <p className="text-zinc-400 text-sm">Hold Tab to view scoreboard</p>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-4 px-4 py-2 text-xs font-semibold text-zinc-500 uppercase border-b border-zinc-800">
              <div>Player</div>
              <div className="text-center">Kills</div>
              <div className="text-center">Deaths</div>
              <div className="text-center">Ping</div>
            </div>

            {players
              .sort((a, b) => b.kills - a.kills)
              .map((player, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-4 gap-4 px-4 py-3 rounded ${
                    player.isYou ? "bg-cyan-500/20 border border-cyan-500/50" : "bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-sm">#{index + 1}</span>
                    <span className={`font-semibold ${player.isYou ? "text-cyan-500" : "text-white"}`}>
                      {player.name}
                    </span>
                  </div>
                  <div className="text-center text-white font-mono">{player.kills}</div>
                  <div className="text-center text-zinc-400 font-mono">{player.deaths}</div>
                  <div className="text-center">
                    <span className="font-mono text-green-500">{Math.floor(Math.random() * 30 + 10)}ms</span>
                  </div>
                </div>
              ))}
          </div>

          <div className="pt-4 border-t border-zinc-800 text-center text-xs text-zinc-500">
            Match ends in 5:00 • First to 20 kills wins
          </div>
        </div>
      </Card>
    </div>
  )
}
