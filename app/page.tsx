"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Crosshair, Zap, Shield, Target } from "lucide-react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const classes = [
  {
    id: "sniper",
    name: "Sniper",
    icon: Target,
    weapon: "Bolt Action",
    health: 60,
    speed: 95,
    description: "High damage, precision shots",
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "smg",
    name: "Runner",
    icon: Zap,
    weapon: "SMG",
    health: 90,
    speed: 110,
    description: "Fast movement, rapid fire",
    color: "from-yellow-500 to-orange-600",
  },
  {
    id: "shotgun",
    name: "Vince",
    icon: Shield,
    weapon: "Shotgun",
    health: 120,
    speed: 85,
    description: "Close range devastation",
    color: "from-red-500 to-pink-600",
  },
  {
    id: "rifle",
    name: "Assault",
    icon: Crosshair,
    weapon: "Assault Rifle",
    health: 100,
    speed: 100,
    description: "Balanced all-rounder",
    color: "from-green-500 to-emerald-600",
  },
]

export default function Home() {
  const [selectedClass, setSelectedClass] = useState("rifle")
  const [botsEnabled, setBotsEnabled] = useState(true)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
              <Crosshair className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Fast Browser FPS</h1>
          </div>
          {/* <nav className="flex gap-6 text-sm text-zinc-400">
            <button className="hover:text-white transition-colors">Settings</button>
            <button className="hover:text-white transition-colors">Stats</button>
          </nav> */}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-6xl w-full space-y-12">
          {/* Title */}
          <div className="text-center space-y-4">
            <h2 className="text-6xl md:text-7xl font-bold tracking-tight">
              Click →{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Play</span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              {"Fast-paced FPS action in your browser. No downloads. Just pure skill."}
            </p>
          </div>

          {/* Class Selection */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-center">Choose Your Class</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {classes.map((cls) => {
                const Icon = cls.icon
                return (
                  <Card
                    key={cls.id}
                    className={`relative overflow-hidden cursor-pointer transition-all border-2 ${
                      selectedClass === cls.id
                        ? "border-cyan-500 bg-zinc-900"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                    onClick={() => setSelectedClass(cls.id)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${cls.color} opacity-10`} />
                    <div className="relative p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <Icon className="w-8 h-8" />
                        {selectedClass === cls.id && <div className="w-3 h-3 rounded-full bg-cyan-500" />}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold">{cls.name}</h4>
                        <p className="text-sm text-zinc-500">{cls.weapon}</p>
                        <p className="text-sm text-zinc-400">{cls.description}</p>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="text-zinc-500">HP</div>
                          <div className="font-semibold">{cls.health}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-zinc-500">Speed</div>
                          <div className="font-semibold">{cls.speed}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Bot Toggle Section */}
          <div className="flex items-center justify-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg max-w-md mx-auto">
            <Switch
              id="bots-toggle"
              checked={botsEnabled}
              onCheckedChange={setBotsEnabled}
              className="data-[state=checked]:bg-cyan-500"
            />
            <Label htmlFor="bots-toggle" className="text-base cursor-pointer">
              Add Bots {botsEnabled ? "(6 AI enemies)" : "(Solo mode)"}
            </Label>
          </div>

          {/* Play Button */}
          <div className="flex flex-col items-center gap-4">
            <Link href={`/game?bots=${botsEnabled}`} className="w-full max-w-md">
              <Button
                size="lg"
                className="w-full text-lg font-semibold h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
              >
                Play Now
              </Button>
            </Link>
            <p className="text-sm text-zinc-500">Quick match • Free for All</p>
          </div>
        </div>
      </main>

      {/* Footer Stats */}
      <footer className="border-t border-zinc-800 px-6 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-cyan-500">5.2K</div>
            <div className="text-sm text-zinc-500">Players Online</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-cyan-500">120</div>
            <div className="text-sm text-zinc-500">Active Lobbies</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-cyan-500">{"<5s"}</div>
            <div className="text-sm text-zinc-500">Avg. Queue Time</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
