"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { PointerLockControls, Sky } from "@react-three/drei"
import * as THREE from "three"

interface PlayerState {
  moveForward: boolean
  moveBackward: boolean
  moveLeft: boolean
  moveRight: boolean
  canJump: boolean
  velocity: THREE.Vector3
}

interface Bot {
  id: number
  name: string
  position: [number, number, number]
  rotation: number
  health: number
  kills: number
  state: "idle" | "chasing" | "dead"
  target: [number, number, number] | null
  lastShot: number
  ammo: number
  respawnTime: number
}

function GameScene({ isPaused }: { isPaused: boolean }) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<any>()
  const playerState = useRef<PlayerState>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    canJump: false,
    velocity: new THREE.Vector3(),
  })

  const weaponState = useRef({
    ammo: 30,
    maxAmmo: 30,
    reserveAmmo: 90,
    fireRate: 100,
    lastShot: 0,
    reloading: false,
  })

  const [playerKills, setPlayerKills] = useState(0)
  const [playerDeaths, setPlayerDeaths] = useState(0)
  const [playerHealth, setPlayerHealth] = useState(100)

  const bulletsRef = useRef<
    Array<{
      id: string
      start: THREE.Vector3
      direction: THREE.Vector3
      createdAt: number
      fromBot?: number
    }>
  >([])

  const [bullets, setBullets] = useState<typeof bulletsRef.current>([])
  const muzzleFlashRef = useRef<THREE.PointLight>(null)

  const [bots, setBots] = useState<Bot[]>([])

  useEffect(() => {
    const botNames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"]
    const spawnPositions: [number, number, number][] = [
      [20, 1.8, 20],
      [-20, 1.8, 20],
      [20, 1.8, -20],
      [-20, 1.8, -20],
      [30, 1.8, 0],
      [-30, 1.8, 0],
    ]

    const initialBots: Bot[] = botNames.map((name, i) => ({
      id: i,
      name,
      position: spawnPositions[i],
      rotation: Math.random() * Math.PI * 2,
      health: 100,
      kills: 0,
      state: "idle" as const,
      target: null,
      lastShot: 0,
      ammo: 30,
      respawnTime: 0,
    }))

    setBots(initialBots)
  }, [])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("playerStatsUpdate", {
        detail: { health: playerHealth, kills: playerKills, deaths: playerDeaths },
      }),
    )
  }, [playerHealth, playerKills, playerDeaths])

  useEffect(() => {
    const handleScoreboardRequest = () => {
      window.dispatchEvent(
        new CustomEvent("scoreboardData", {
          detail: {
            player: { kills: playerKills, deaths: playerDeaths },
            bots: bots.map((b) => ({ name: b.name, kills: b.kills, deaths: 0 })),
          },
        }),
      )
    }

    window.addEventListener("requestScoreboardData", handleScoreboardRequest)
    return () => window.removeEventListener("requestScoreboardData", handleScoreboardRequest)
  }, [playerKills, playerDeaths, bots])

  useEffect(() => {
    const handleRestart = () => {
      weaponState.current = {
        ammo: 30,
        maxAmmo: 30,
        reserveAmmo: 90,
        fireRate: 100,
        lastShot: 0,
        reloading: false,
      }
      bulletsRef.current = []
      setBullets([])
      camera.position.set(0, 1.8, 0)
      playerState.current.velocity.set(0, 0, 0)
      playerState.current.canJump = false
      setPlayerKills(0)
      setPlayerDeaths(0)
      setPlayerHealth(100)

      setBots((prev) =>
        prev.map((bot) => ({
          ...bot,
          health: 100,
          kills: 0,
          state: "idle" as const,
          ammo: 30,
          respawnTime: 0,
        })),
      )

      window.dispatchEvent(
        new CustomEvent("ammoUpdate", {
          detail: { ammo: 30, reserve: 90 },
        }),
      )
    }

    window.addEventListener("restartMatch", handleRestart)
    return () => window.removeEventListener("restartMatch", handleRestart)
  }, [camera])

  useEffect(() => {
    if (isPaused && controlsRef.current?.isLocked) {
      controlsRef.current.unlock()
    }
  }, [isPaused])

  useEffect(() => {
    camera.position.set(0, 1.8, 0)

    const onKeyDown = (event: KeyboardEvent) => {
      if (isPaused) return

      const player = playerState.current
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          player.moveForward = true
          break
        case "KeyS":
        case "ArrowDown":
          player.moveBackward = true
          break
        case "KeyA":
        case "ArrowLeft":
          player.moveLeft = true
          break
        case "KeyD":
        case "ArrowRight":
          player.moveRight = true
          break
        case "Space":
          if (player.canJump) {
            player.velocity.y = 8
            player.canJump = false
          }
          break
        case "KeyR":
          reload()
          break
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const player = playerState.current
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          player.moveForward = false
          break
        case "KeyS":
        case "ArrowDown":
          player.moveBackward = false
          break
        case "KeyA":
        case "ArrowLeft":
          player.moveLeft = false
          break
        case "KeyD":
        case "ArrowRight":
          player.moveRight = false
          break
      }
    }

    const onMouseDown = (event: MouseEvent) => {
      if (!controlsRef.current?.isLocked || isPaused) return
      if (event.button === 0) {
        shoot()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("keyup", onKeyUp)
    document.addEventListener("mousedown", onMouseDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("keyup", onKeyUp)
      document.removeEventListener("mousedown", onMouseDown)
    }
  }, [camera, isPaused])

  useEffect(() => {
    const handleRequestPointerLock = () => {
      if (!controlsRef.current) return

      // Check if the canvas element is still in the DOM
      const canvas = gl.domElement
      if (!canvas || !document.body.contains(canvas)) return

      // Only lock if not already locked
      if (!controlsRef.current.isLocked) {
        try {
          controlsRef.current.lock()
        } catch (error) {
          console.error("Failed to request pointer lock:", error)
        }
      }
    }

    window.addEventListener("requestPointerLock", handleRequestPointerLock)
    return () => window.removeEventListener("requestPointerLock", handleRequestPointerLock)
  }, [gl])

  const shoot = () => {
    const currentTime = performance.now()
    const weapon = weaponState.current

    if (weapon.ammo <= 0 || weapon.reloading || currentTime - weapon.lastShot < weapon.fireRate) {
      return
    }

    weapon.ammo--
    weapon.lastShot = currentTime

    if (muzzleFlashRef.current) {
      muzzleFlashRef.current.intensity = 2
      setTimeout(() => {
        if (muzzleFlashRef.current) {
          muzzleFlashRef.current.intensity = 0
        }
      }, 50)
    }

    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    const start = camera.position.clone()
    start.y -= 0.2

    const newBullet = {
      id: Math.random().toString(),
      start: start.clone(),
      direction: direction.clone(),
      createdAt: currentTime,
    }

    bulletsRef.current.push(newBullet)
    setBullets([...bulletsRef.current])

    checkBulletHitBots(start, direction)

    window.dispatchEvent(
      new CustomEvent("ammoUpdate", {
        detail: { ammo: weapon.ammo, reserve: weapon.reserveAmmo },
      }),
    )
  }

  const checkBulletHitBots = (start: THREE.Vector3, direction: THREE.Vector3) => {
    const raycaster = new THREE.Raycaster(start, direction.normalize(), 0, 100)

    setBots((prevBots) => {
      const updatedBots = [...prevBots]
      let hitDetected = false

      for (let i = 0; i < updatedBots.length; i++) {
        const bot = updatedBots[i]
        if (bot.state === "dead") continue

        const botPos = new THREE.Vector3(...bot.position)
        const distance = raycaster.ray.distanceToPoint(botPos)

        if (distance < 1.5) {
          updatedBots[i] = {
            ...bot,
            health: bot.health - 25,
          }

          if (updatedBots[i].health <= 0) {
            updatedBots[i] = {
              ...updatedBots[i],
              state: "dead",
              respawnTime: performance.now() + 3000,
            }
            setPlayerKills((prev) => prev + 1)
            hitDetected = true
          }
          break
        }
      }

      return updatedBots
    })
  }

  const reload = () => {
    const weapon = weaponState.current
    if (weapon.reloading || weapon.ammo === weapon.maxAmmo || weapon.reserveAmmo === 0) {
      return
    }

    weapon.reloading = true
    setTimeout(() => {
      const ammoNeeded = weapon.maxAmmo - weapon.ammo
      const ammoToReload = Math.min(ammoNeeded, weapon.reserveAmmo)
      weapon.ammo += ammoToReload
      weapon.reserveAmmo -= ammoToReload
      weapon.reloading = false

      window.dispatchEvent(
        new CustomEvent("ammoUpdate", {
          detail: { ammo: weapon.ammo, reserve: weapon.reserveAmmo },
        }),
      )
    }, 1500)
  }

  useFrame((state, delta) => {
    if (isPaused) return

    const currentTime = performance.now()
    const player = playerState.current

    // Player physics
    player.velocity.y -= 25 * delta

    if (controlsRef.current?.isLocked) {
      const direction = new THREE.Vector3()
      const rotation = new THREE.Euler(0, 0, 0, "YXZ")
      rotation.setFromQuaternion(camera.quaternion)

      direction.z = Number(player.moveForward) - Number(player.moveBackward)
      direction.x = Number(player.moveRight) - Number(player.moveLeft)
      direction.normalize()

      if (player.moveForward || player.moveBackward) {
        const forward = new THREE.Vector3(0, 0, -1)
        forward.applyQuaternion(camera.quaternion)
        forward.y = 0
        forward.normalize()
        camera.position.addScaledVector(forward, direction.z * 10 * delta)
      }

      if (player.moveLeft || player.moveRight) {
        const right = new THREE.Vector3(1, 0, 0)
        right.applyQuaternion(camera.quaternion)
        right.y = 0
        right.normalize()
        camera.position.addScaledVector(right, direction.x * 10 * delta)
      }

      camera.position.y += player.velocity.y * delta

      if (camera.position.y < 1.8) {
        camera.position.y = 1.8
        player.velocity.y = 0
        player.canJump = true
      }
    }

    // Update bots
    setBots((prevBots) => {
      return prevBots.map((bot) => {
        if (bot.state === "dead") {
          if (currentTime >= bot.respawnTime) {
            const spawnPositions: [number, number, number][] = [
              [20, 1.8, 20],
              [-20, 1.8, 20],
              [20, 1.8, -20],
              [-20, 1.8, -20],
              [30, 1.8, 0],
              [-30, 1.8, 0],
            ]
            return {
              ...bot,
              position: spawnPositions[bot.id % spawnPositions.length],
              health: 100,
              state: "idle",
              ammo: 30,
            }
          }
          return bot
        }

        const botPos = new THREE.Vector3(...bot.position)
        const playerPos = camera.position.clone()
        const distanceToPlayer = botPos.distanceTo(playerPos)

        let newState = bot.state
        let newTarget = bot.target
        let newRotation = bot.rotation
        const newPos = [...bot.position] as [number, number, number]

        if (distanceToPlayer < 30) {
          newState = "chasing"
          newTarget = [playerPos.x, playerPos.y, playerPos.z]

          const angleToPlayer = Math.atan2(playerPos.x - botPos.x, playerPos.z - botPos.z)
          newRotation = angleToPlayer

          const moveDir = new THREE.Vector3(playerPos.x - botPos.x, 0, playerPos.z - botPos.z).normalize()

          if (distanceToPlayer > 15) {
            newPos[0] += moveDir.x * 5 * delta
            newPos[2] += moveDir.z * 5 * delta
          }

          if (distanceToPlayer < 40 && bot.ammo > 0 && currentTime - bot.lastShot > 300) {
            const direction = moveDir.clone()
            const spread = 0.1
            direction.x += (Math.random() - 0.5) * spread
            direction.z += (Math.random() - 0.5) * spread
            direction.normalize()

            const bulletStart = botPos.clone()
            bulletStart.y = bot.position[1]

            bulletsRef.current.push({
              id: Math.random().toString(),
              start: bulletStart,
              direction,
              createdAt: currentTime,
              fromBot: bot.id,
            })

            const hitPlayer = Math.random() < 0.2 && distanceToPlayer < 20
            if (hitPlayer) {
              setPlayerHealth((prev) => {
                const newHealth = Math.max(0, prev - 15)
                if (newHealth === 0) {
                  setPlayerDeaths((d) => d + 1)
                  setTimeout(() => {
                    camera.position.set(0, 1.8, 0)
                    setPlayerHealth(100)
                  }, 2000)
                }
                return newHealth
              })
            }

            return {
              ...bot,
              position: newPos,
              rotation: newRotation,
              state: newState,
              target: newTarget,
              lastShot: currentTime,
              ammo: bot.ammo - 1,
            }
          }
        } else {
          newState = "idle"
          if (!newTarget || Math.random() < 0.01) {
            newTarget = [(Math.random() - 0.5) * 60, 1.8, (Math.random() - 0.5) * 60] as [number, number, number]
          }

          const targetVec = new THREE.Vector3(...newTarget)
          const distanceToTarget = botPos.distanceTo(targetVec)

          if (distanceToTarget > 2) {
            const moveDir = new THREE.Vector3(newTarget[0] - botPos.x, 0, newTarget[2] - botPos.z).normalize()

            newPos[0] += moveDir.x * 3 * delta
            newPos[2] += moveDir.z * 3 * delta
            newRotation = Math.atan2(moveDir.x, moveDir.z)
          } else {
            newTarget = null
          }
        }

        if (bot.ammo === 0 && currentTime - bot.lastShot > 2000) {
          return {
            ...bot,
            position: newPos,
            rotation: newRotation,
            state: newState,
            target: newTarget,
            ammo: 30,
          }
        }

        return {
          ...bot,
          position: newPos,
          rotation: newRotation,
          state: newState,
          target: newTarget,
        }
      })
    })

    // Bullet cleanup
    bulletsRef.current = bulletsRef.current.filter((bullet) => currentTime - bullet.createdAt < 1000)
    if (bulletsRef.current.length !== bullets.length) {
      setBullets([...bulletsRef.current])
    }
  })

  return (
    <>
      <PointerLockControls ref={controlsRef} />

      <ambientLight intensity={1.5} color={0x404040} />
      <directionalLight position={[50, 100, 50]} intensity={1} castShadow />
      <directionalLight position={[-50, 50, -50]} intensity={0.5} color={0x4a90e2} />

      <pointLight ref={muzzleFlashRef} position={[0, -0.2, -0.5]} color={0xffa500} intensity={0} distance={10} />

      <Sky sunPosition={[100, 100, 100]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={0x1a1a1a} roughness={0.8} />
      </mesh>

      <gridHelper args={[200, 40, 0x06b6d4, 0x2a2a2a]} />

      <Map />

      {bots.map(
        (bot) =>
          bot.state !== "dead" && (
            <group key={bot.id} position={bot.position} rotation={[0, bot.rotation, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.8, 1.8, 0.5]} />
                <meshStandardMaterial color={bot.state === "chasing" ? 0xff4444 : 0x4444ff} />
              </mesh>
              <mesh position={[0, 1.2, 0]} castShadow>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
                <meshStandardMaterial color={0xffaa88} />
              </mesh>
            </group>
          ),
      )}

      {bullets.map((bullet) => (
        <BulletTracer key={bullet.id} bullet={bullet} />
      ))}
    </>
  )
}

function BulletTracer({ bullet }: { bullet: any }) {
  const ref = useRef<THREE.Line>(null)

  useFrame((state, delta) => {
    if (ref.current) {
      // Manually update position without relying on the position prop
      ref.current.position.addScaledVector(bullet.direction, 100 * delta)
    }
  })

  useEffect(() => {
    // Set initial position on mount
    if (ref.current) {
      ref.current.position.copy(bullet.start)
    }
  }, [bullet.start])

  const points = [new THREE.Vector3(0, 0, 0), bullet.direction.clone().multiplyScalar(2)]

  return (
    <line ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={bullet.fromBot !== undefined ? 0xff4444 : 0x00ffff} linewidth={2} />
    </line>
  )
}

function Map() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.5, 12]} />
        <meshStandardMaterial color={0x06b6d4} roughness={0.5} emissive={0x06b6d4} emissiveIntensity={0.2} />
      </mesh>

      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 8, 3]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.7} />
      </mesh>

      {[
        [25, 25],
        [-25, 25],
        [25, -25],
        [-25, -25],
      ].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 3, z]} castShadow receiveShadow>
            <boxGeometry args={[8, 6, 8]} />
            <meshStandardMaterial color={0x2a2a2a} roughness={0.7} />
          </mesh>
          <mesh position={[x, 6.25, z]} castShadow>
            <boxGeometry args={[8, 0.5, 8]} />
            <meshStandardMaterial color={0x06b6d4} roughness={0.5} emissive={0x06b6d4} emissiveIntensity={0.2} />
          </mesh>
          <pointLight position={[x, 7, z]} color={0x06b6d4} intensity={0.5} distance={15} />
        </group>
      ))}

      {[
        { pos: [15, 2, 0], size: [1, 4, 15] },
        { pos: [-15, 2, 0], size: [1, 4, 15] },
        { pos: [0, 2, 15], size: [15, 4, 1] },
        { pos: [0, 2, -15], size: [15, 4, 1] },
      ].map((wall, i) => (
        <mesh key={i} position={wall.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={wall.size as [number, number, number]} />
          <meshStandardMaterial color={0x1f1f1f} roughness={0.8} />
        </mesh>
      ))}

      {[
        [10, 1.5, 10],
        [-10, 1.5, 10],
        [10, 1.5, -10],
        [-10, 1.5, -10],
        [20, 1, 8],
        [-20, 1, -8],
        [8, 1, 20],
        [-8, 1, -20],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[3, y * 2, 3]} />
          <meshStandardMaterial color={0x2a2a2a} roughness={0.7} />
        </mesh>
      ))}

      <mesh position={[0, 3, -50]} castShadow receiveShadow>
        <boxGeometry args={[100, 6, 1]} />
        <meshStandardMaterial color={0x1f1f1f} roughness={0.8} />
      </mesh>
      <mesh position={[0, 3, 50]} castShadow receiveShadow>
        <boxGeometry args={[100, 6, 1]} />
        <meshStandardMaterial color={0x1f1f1f} roughness={0.8} />
      </mesh>
      <mesh position={[50, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 6, 100]} />
        <meshStandardMaterial color={0x1f1f1f} roughness={0.8} />
      </mesh>
      <mesh position={[-50, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 6, 100]} />
        <meshStandardMaterial color={0x1f1f1f} roughness={0.8} />
      </mesh>
    </group>
  )
}

interface GameCanvasProps {
  isPaused: boolean
  botsEnabled?: boolean
}

export function GameCanvas({ isPaused, botsEnabled = true }: GameCanvasProps) {
  const [bots, setBots] = useState<Bot[]>([])

  useEffect(() => {
    if (!botsEnabled) {
      setBots([])
      return
    }

    const botNames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"]
    const spawnPositions: [number, number, number][] = [
      [20, 1.8, 20],
      [-20, 1.8, 20],
      [20, 1.8, -20],
      [-20, 1.8, -20],
      [30, 1.8, 0],
      [-30, 1.8, 0],
    ]

    const initialBots: Bot[] = botNames.map((name, i) => ({
      id: i,
      name,
      position: spawnPositions[i],
      rotation: Math.random() * Math.PI * 2,
      health: 100,
      kills: 0,
      state: "idle" as const,
      target: null,
      lastShot: 0,
      ammo: 30,
      respawnTime: 0,
    }))

    setBots(initialBots)
  }, [botsEnabled])

  return (
    <div className="w-full h-screen">
      <Canvas shadows camera={{ fov: 75, near: 0.1, far: 1000 }}>
        <GameScene isPaused={isPaused} />
      </Canvas>
    </div>
  )
}
