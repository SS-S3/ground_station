<template>
    <div class="trajectory-3d" ref="containerRef">
        <div class="trajectory-controls">
            <button @click="resetCamera" class="control-btn">Reset View</button>
            <button @click="toggleAutoRotate" class="control-btn">
                {{ autoRotate ? 'Stop Rotation' : 'Auto Rotate' }}
            </button>
            <button @click="centerOnRocket" class="control-btn">Center on Rocket</button>
        </div>
        <div class="trajectory-info">
            <div class="info-item">
                <span>Current Altitude: {{ currentAltitude.toFixed(1) }}m</span>
            </div>
            <div class="info-item">
                <span>Phase: {{ currentPhase }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
    flightData: Object,
    telemetryData: Object,
    currentPhase: String
})

const containerRef = ref(null)
const autoRotate = ref(true)
const currentAltitude = ref(0)

// Three.js objects
let scene, camera, renderer, controls
let rocketMesh, trajectoryLine, groundPlane
let trajectoryPoints = []
let animationId

onMounted(() => {
    initThreeJS()
    createScene()
    animate()
})

onUnmounted(() => {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }
    if (renderer) {
        renderer.dispose()
    }
})

watch(() => props.telemetryData, (newData) => {
    if (newData && rocketMesh) {
        updateRocketPosition(newData)
        updateTrajectory(newData)
        currentAltitude.value = newData.altitude
    }
}, { deep: true })

const initThreeJS = () => {
    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    scene.fog = new THREE.Fog(0x0a0a0a, 100, 2000)

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        containerRef.value.clientWidth / containerRef.value.clientHeight,
        0.1,
        5000
    )
    camera.position.set(200, 300, 400)
    camera.lookAt(0, 0, 0)

    // Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    })
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.value.appendChild(renderer.domElement)

    // Controls (simple mouse controls)
    addMouseControls()

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 200, 100)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Handle window resize
    window.addEventListener('resize', onWindowResize)
}

const createScene = () => {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000)
    const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x1a1a2e,
        transparent: true,
        opacity: 0.8
    })
    groundPlane = new THREE.Mesh(groundGeometry, groundMaterial)
    groundPlane.rotation.x = -Math.PI / 2
    groundPlane.position.y = 0
    groundPlane.receiveShadow = true
    scene.add(groundPlane)

    // Grid
    const gridHelper = new THREE.GridHelper(1000, 20, 0x00d4ff, 0x004466)
    gridHelper.position.y = 1
    scene.add(gridHelper)

    // Launch pad
    createLaunchPad()

    // Rocket
    createRocket()

    // Coordinate axes
    const axesHelper = new THREE.AxesHelper(100)
    scene.add(axesHelper)
}

const createLaunchPad = () => {
    // Launch pad platform
    const padGeometry = new THREE.CylinderGeometry(20, 25, 5, 16)
    const padMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const launchPad = new THREE.Mesh(padGeometry, padMaterial)
    launchPad.position.y = 2.5
    launchPad.castShadow = true
    scene.add(launchPad)

    // Launch tower
    const towerGeometry = new THREE.BoxGeometry(2, 50, 2)
    const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 })
    const tower = new THREE.Mesh(towerGeometry, towerMaterial)
    tower.position.set(30, 25, 0)
    tower.castShadow = true
    scene.add(tower)
}

const createRocket = () => {
    const rocketGroup = new THREE.Group()

    // Rocket body
    const bodyGeometry = new THREE.CylinderGeometry(2, 3, 20, 16)
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    rocketGroup.add(body)

    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(2, 8, 16)
    const noseMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 })
    const nose = new THREE.Mesh(noseGeometry, noseMaterial)
    nose.position.y = 14
    nose.castShadow = true
    rocketGroup.add(nose)

    // Fins
    for (let i = 0; i < 4; i++) {
        const finGeometry = new THREE.BoxGeometry(0.5, 8, 4)
        const finMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 })
        const fin = new THREE.Mesh(finGeometry, finMaterial)
        const angle = (i / 4) * Math.PI * 2
        fin.position.x = Math.cos(angle) * 3
        fin.position.z = Math.sin(angle) * 3
        fin.position.y = -6
        fin.castShadow = true
        rocketGroup.add(fin)
    }

    // Flame effect (initially hidden)
    const flameGeometry = new THREE.ConeGeometry(3, 15, 8)
    const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
    })
    const flame = new THREE.Mesh(flameGeometry, flameMaterial)
    flame.position.y = -20
    flame.visible = false
    rocketGroup.add(flame)

    rocketMesh = rocketGroup
    rocketMesh.position.set(0, 15, 0)
    scene.add(rocketMesh)

    // Store flame reference for later use
    rocketMesh.flame = flame
}

const updateRocketPosition = (telemetryData) => {
    if (!rocketMesh) return

    // Update rocket position based on GPS and altitude
    const baseX = 0 // Base launch position
    const baseZ = 0

    // Calculate position offset based on GPS (simplified)
    const x = baseX + (telemetryData.gps.lon - 77.5946) * 111000 // Rough conversion
    const z = baseZ + (telemetryData.gps.lat - 12.9716) * 111000
    const y = telemetryData.altitude

    rocketMesh.position.set(x, y, z)

    // Update rocket orientation based on attitude
    rocketMesh.rotation.x = THREE.MathUtils.degToRad(telemetryData.attitude.pitch)
    rocketMesh.rotation.y = THREE.MathUtils.degToRad(telemetryData.attitude.yaw)
    rocketMesh.rotation.z = THREE.MathUtils.degToRad(telemetryData.attitude.roll)

    // Show/hide flame based on phase
    if (rocketMesh.flame) {
        rocketMesh.flame.visible = props.currentPhase === 'Boost'
        if (rocketMesh.flame.visible) {
            // Animate flame
            rocketMesh.flame.scale.y = 0.8 + Math.random() * 0.4
            rocketMesh.flame.scale.x = 0.9 + Math.random() * 0.2
            rocketMesh.flame.scale.z = 0.9 + Math.random() * 0.2
        }
    }
}

const updateTrajectory = (telemetryData) => {
    // Add current position to trajectory
    const position = new THREE.Vector3(
        rocketMesh.position.x,
        rocketMesh.position.y,
        rocketMesh.position.z
    )
    trajectoryPoints.push(position)

    // Limit trajectory points for performance
    if (trajectoryPoints.length > 500) {
        trajectoryPoints.shift()
    }

    // Update trajectory line
    if (trajectoryLine) {
        scene.remove(trajectoryLine)
    }

    if (trajectoryPoints.length > 1) {
        const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints)
        const trajectoryMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            linewidth: 2
        })
        trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial)
        scene.add(trajectoryLine)
    }
}

const addMouseControls = () => {
    let isMouseDown = false
    let mouseX = 0
    let mouseY = 0

    const onMouseDown = (event) => {
        isMouseDown = true
        mouseX = event.clientX
        mouseY = event.clientY
    }

    const onMouseUp = () => {
        isMouseDown = false
    }

    const onMouseMove = (event) => {
        if (!isMouseDown) return

        const deltaX = event.clientX - mouseX
        const deltaY = event.clientY - mouseY

        // Rotate camera around the rocket
        const spherical = new THREE.Spherical()
        spherical.setFromVector3(camera.position.clone().sub(rocketMesh ? rocketMesh.position : new THREE.Vector3(0, 0, 0)))

        spherical.theta -= deltaX * 0.01
        spherical.phi += deltaY * 0.01
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

        camera.position.setFromSpherical(spherical)
        if (rocketMesh) {
            camera.position.add(rocketMesh.position)
            camera.lookAt(rocketMesh.position)
        }

        mouseX = event.clientX
        mouseY = event.clientY
    }

    const onWheel = (event) => {
        // Zoom in/out
        const distance = camera.position.distanceTo(rocketMesh ? rocketMesh.position : new THREE.Vector3(0, 0, 0))
        const factor = event.deltaY > 0 ? 1.1 : 0.9

        if (distance * factor > 10 && distance * factor < 2000) {
            camera.position.multiplyScalar(factor)
        }
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('wheel', onWheel)
}

const animate = () => {
    animationId = requestAnimationFrame(animate)

    // Auto-rotate camera
    if (autoRotate.value && rocketMesh) {
        const time = Date.now() * 0.0005
        const radius = camera.position.distanceTo(rocketMesh.position)
        camera.position.x = Math.cos(time) * radius
        camera.position.z = Math.sin(time) * radius
        camera.lookAt(rocketMesh.position)
    }

    renderer.render(scene, camera)
}

const resetCamera = () => {
    camera.position.set(200, 300, 400)
    if (rocketMesh) {
        camera.lookAt(rocketMesh.position)
    } else {
        camera.lookAt(0, 0, 0)
    }
}

const toggleAutoRotate = () => {
    autoRotate.value = !autoRotate.value
}

const centerOnRocket = () => {
    if (rocketMesh) {
        camera.lookAt(rocketMesh.position)
    }
}

const onWindowResize = () => {
    if (!containerRef.value) return

    camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}
</script>

<style scoped>
.trajectory-3d {
    position: relative;
    height: 400px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(0, 212, 255, 0.2);
    overflow: hidden;
}

.trajectory-controls {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    display: flex;
    gap: 0.5rem;
}

.control-btn {
    padding: 0.5rem 0.75rem;
    background: rgba(0, 212, 255, 0.2);
    border: 1px solid #00d4ff;
    border-radius: 4px;
    color: #00d4ff;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.3s ease;
}

.control-btn:hover {
    background: rgba(0, 212, 255, 0.4);
}

.trajectory-info {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.7);
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(0, 212, 255, 0.3);
}

.info-item {
    color: #00d4ff;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
}

.info-item:last-child {
    margin-bottom: 0;
}
</style>
  
