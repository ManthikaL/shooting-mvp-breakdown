import * as THREE from "three"

export function createMap(scene: THREE.Scene): THREE.Mesh[] {
  const mapObjects: THREE.Mesh[] = []

  // Ground
  const groundGeometry = new THREE.PlaneGeometry(200, 200)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Grid helper
  const gridHelper = new THREE.GridHelper(200, 40, 0x06b6d4, 0x2a2a2a)
  scene.add(gridHelper)

  // Materials
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.7,
  })

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.5,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.2,
  })

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1f1f,
    roughness: 0.8,
  })

  // Create central platform
  const centralPlatform = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 12), accentMaterial.clone())
  centralPlatform.position.set(0, 0.25, 0)
  centralPlatform.castShadow = true
  centralPlatform.receiveShadow = true
  scene.add(centralPlatform)
  mapObjects.push(centralPlatform)

  // Central tower
  const centralTower = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 3), boxMaterial.clone())
  centralTower.position.set(0, 4, 0)
  centralTower.castShadow = true
  centralTower.receiveShadow = true
  scene.add(centralTower)
  mapObjects.push(centralTower)

  // Corner structures
  const cornerPositions = [
    [25, 3, 25],
    [-25, 3, 25],
    [25, 3, -25],
    [-25, 3, -25],
  ]

  cornerPositions.forEach(([x, y, z]) => {
    // Large corner box
    const cornerBox = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 8), boxMaterial.clone())
    cornerBox.position.set(x, y, z)
    cornerBox.castShadow = true
    cornerBox.receiveShadow = true
    scene.add(cornerBox)
    mapObjects.push(cornerBox)

    // Accent light on top
    const accentBox = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 8), accentMaterial.clone())
    accentBox.position.set(x, y + 3.25, z)
    accentBox.castShadow = true
    scene.add(accentBox)
    mapObjects.push(accentBox)

    // Point light
    const cornerLight = new THREE.PointLight(0x06b6d4, 0.5, 15)
    cornerLight.position.set(x, y + 4, z)
    scene.add(cornerLight)
  })

  // Mid-section walls
  const wallPositions = [
    { pos: [15, 2, 0], size: [1, 4, 15] },
    { pos: [-15, 2, 0], size: [1, 4, 15] },
    { pos: [0, 2, 15], size: [15, 4, 1] },
    { pos: [0, 2, -15], size: [15, 4, 1] },
  ]

  wallPositions.forEach(({ pos, size }) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), wallMaterial.clone())
    wall.position.set(pos[0], pos[1], pos[2])
    wall.castShadow = true
    wall.receiveShadow = true
    scene.add(wall)
    mapObjects.push(wall)
  })

  // Scattered cover boxes
  const coverPositions = [
    [10, 1.5, 10],
    [-10, 1.5, 10],
    [10, 1.5, -10],
    [-10, 1.5, -10],
    [20, 1, 8],
    [-20, 1, -8],
    [8, 1, 20],
    [-8, 1, -20],
    [18, 1.5, -12],
    [-18, 1.5, 12],
  ]

  coverPositions.forEach(([x, y, z]) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(3, y * 2, 3), boxMaterial.clone())
    box.position.set(x, y, z)
    box.castShadow = true
    box.receiveShadow = true
    scene.add(box)
    mapObjects.push(box)
  })

  // Ramps
  const rampGeometry = new THREE.BoxGeometry(4, 0.5, 8)
  const rampPositions = [
    { pos: [30, 1, 0], rot: 0 },
    { pos: [-30, 1, 0], rot: Math.PI },
    { pos: [0, 1, 30], rot: -Math.PI / 2 },
    { pos: [0, 1, -30], rot: Math.PI / 2 },
  ]

  rampPositions.forEach(({ pos, rot }) => {
    const ramp = new THREE.Mesh(rampGeometry, boxMaterial.clone())
    ramp.position.set(pos[0], pos[1], pos[2])
    ramp.rotation.y = rot
    ramp.rotation.x = Math.PI / 8
    ramp.castShadow = true
    ramp.receiveShadow = true
    scene.add(ramp)
    mapObjects.push(ramp)
  })

  // Boundary walls
  const boundaryHeight = 6
  const boundaryThickness = 1

  // North wall
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(100, boundaryHeight, boundaryThickness), wallMaterial.clone())
  northWall.position.set(0, boundaryHeight / 2, -50)
  northWall.castShadow = true
  northWall.receiveShadow = true
  scene.add(northWall)
  mapObjects.push(northWall)

  // South wall
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(100, boundaryHeight, boundaryThickness), wallMaterial.clone())
  southWall.position.set(0, boundaryHeight / 2, 50)
  southWall.castShadow = true
  southWall.receiveShadow = true
  scene.add(southWall)
  mapObjects.push(southWall)

  // East wall
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(boundaryThickness, boundaryHeight, 100), wallMaterial.clone())
  eastWall.position.set(50, boundaryHeight / 2, 0)
  eastWall.castShadow = true
  eastWall.receiveShadow = true
  scene.add(eastWall)
  mapObjects.push(eastWall)

  // West wall
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(boundaryThickness, boundaryHeight, 100), wallMaterial.clone())
  westWall.position.set(-50, boundaryHeight / 2, 0)
  westWall.castShadow = true
  westWall.receiveShadow = true
  scene.add(westWall)
  mapObjects.push(westWall)

  return mapObjects
}
