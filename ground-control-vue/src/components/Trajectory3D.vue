<template>
    <div class="trajectory-3d">
        <div class="trajectory-header">
            <div class="trajectory-title">
                <h4>3D Flight Trajectory</h4>
                <div v-if="isShowingTrajectory" class="recording-indicator">
                    <span class="recording-dot"></span>
                    Recording
                </div>
            </div>
            <div class="trajectory-controls">
                <button @click="resetCamera" class="control-btn">Reset View</button>
                <button @click="toggleAnimation" class="control-btn">
                    {{ animationEnabled ? 'Pause' : 'Play' }}
                </button>
                <button @click="clearTrajectory" class="control-btn">Clear</button>
            </div>
        </div>

        <div class="trajectory-container" ref="containerRef"></div>

        <div class="trajectory-info">
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Altitude:</span>
                    <span class="info-value">{{ currentAltitude.toFixed(1) }}m</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Phase:</span>
                    <span class="info-value phase" :class="phaseClass">{{ currentPhase }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Position:</span>
                    <span class="info-value">{{ formatPosition(currentPosition) }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Distance:</span>
                    <span class="info-value">{{ currentDistance.toFixed(1) }}m</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as THREE from 'three'

export default {
    name: 'Trajectory3D',
    props: {
        trajectoryPoints: {
            type: Array,
            default: () => []
        },
        currentPosition: {
            type: Object,
            default: () => ({ x: 0, y: 0, altitude: 0 })
        },
        flightPhase: {
            type: String,
            default: 'Pre-Launch'
        },
        isActive: {
            type: Boolean,
            default: false
        }
    },
    setup(props) {
        const containerRef = ref(null)
        const animationEnabled = ref(true)

        // Three.js objects
        let scene, camera, renderer, controls
        let trajectoryLine, trajectoryMarkers, vehicleMesh, groundPlane
        let animationFrameId
        
        // Marker parameters
        const markerInterval = 10 // Add a marker every 10 points

        // Trajectory data
        const trajectoryGeometry = ref(null)
        const trajectoryMaterial = ref(null)

        // Computed values
        const currentAltitude = computed(() => props.currentPosition.altitude || 0)
        const currentPhase = computed(() => props.flightPhase)
        const currentDistance = computed(() => {
            const { x, y } = props.currentPosition
            return Math.sqrt(x * x + y * y)
        })

        const phaseClass = computed(() => {
            switch (props.flightPhase) {
                case 'Pre-Launch': return 'pre-launch'
                case 'Powered Ascent': return 'powered-ascent'
                case 'Coast': return 'coast'
                case 'Descent': return 'descent'
                case 'Recovery': return 'recovery'
                default: return 'unknown'
            }
        })

        const initThreeJS = () => {
            if (!containerRef.value) return

            const container = containerRef.value
            const width = container.clientWidth
            const height = container.clientHeight

            // Scene
            scene = new THREE.Scene()
            scene.background = new THREE.Color(0x0a0a0a)
            scene.fog = new THREE.Fog(0x0a0a0a, 500, 2000)

            // Camera
            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000)
            camera.position.set(200, 200, 200)
            camera.lookAt(0, 0, 0)

            // Renderer
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
            renderer.setSize(width, height)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            renderer.shadowMap.enabled = true
            renderer.shadowMap.type = THREE.PCFSoftShadowMap
            container.appendChild(renderer.domElement)

            // Lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
            scene.add(ambientLight)

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
            directionalLight.position.set(100, 100, 50)
            directionalLight.castShadow = true
            directionalLight.shadow.mapSize.width = 2048
            directionalLight.shadow.mapSize.height = 2048
            directionalLight.shadow.camera.near = 0.1
            directionalLight.shadow.camera.far = 1000
            directionalLight.shadow.camera.left = -200
            directionalLight.shadow.camera.right = 200
            directionalLight.shadow.camera.top = 200
            directionalLight.shadow.camera.bottom = -200
            scene.add(directionalLight)

            // Ground plane
            const groundGeometry = new THREE.PlaneGeometry(1000, 1000)
            const groundMaterial = new THREE.MeshLambertMaterial({
                color: 0x333333,
                transparent: true,
                opacity: 0.3
            })
            groundPlane = new THREE.Mesh(groundGeometry, groundMaterial)
            groundPlane.rotation.x = -Math.PI / 2
            groundPlane.receiveShadow = true
            scene.add(groundPlane)

            // Grid helper
            const gridHelper = new THREE.GridHelper(1000, 50, 0x666666, 0x333333)
            scene.add(gridHelper)

            // Axes helper
            const axesHelper = new THREE.AxesHelper(100)
            scene.add(axesHelper)

            // Vehicle mesh (rocket)
            const vehicleGeometry = new THREE.ConeGeometry(3, 15, 8)
            const vehicleMaterial = new THREE.MeshPhongMaterial({
                color: 0xff6b35,
                emissive: 0x331100
            })
            vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial)
            vehicleMesh.castShadow = true
            scene.add(vehicleMesh)

            // Trajectory line (dotted)
            trajectoryGeometry.value = new THREE.BufferGeometry()
            trajectoryMaterial.value = new THREE.LineDashedMaterial({
                color: 0x42a5f5,
                linewidth: 2,
                dashSize: 5,
                gapSize: 3
            })
            trajectoryLine = new THREE.Line(trajectoryGeometry.value, trajectoryMaterial.value)
            scene.add(trajectoryLine)

            // Trajectory markers (spheres)
            const markerGeometry = new THREE.SphereGeometry(1, 8, 6)
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x42a5f5 })
            
            // Create marker group
            trajectoryMarkers = new THREE.Group()
            scene.add(trajectoryMarkers)

            // Controls (simple orbit controls implementation)
            setupControls()

            // Start animation loop
            animate()

            // Handle resize
            window.addEventListener('resize', handleResize)
        }

        const setupControls = () => {
            let isDragging = false
            let previousMousePosition = { x: 0, y: 0 }
            let spherical = new THREE.Spherical()
            spherical.setFromVector3(camera.position)

            const onMouseDown = (event) => {
                isDragging = true
                previousMousePosition = { x: event.clientX, y: event.clientY }
            }

            const onMouseMove = (event) => {
                if (!isDragging) return

                const deltaMove = {
                    x: event.clientX - previousMousePosition.x,
                    y: event.clientY - previousMousePosition.y
                }

                spherical.theta -= deltaMove.x * 0.01
                spherical.phi += deltaMove.y * 0.01
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

                camera.position.setFromSpherical(spherical)
                camera.lookAt(0, 0, 0)

                previousMousePosition = { x: event.clientX, y: event.clientY }
            }

            const onMouseUp = () => {
                isDragging = false
            }

            const onWheel = (event) => {
                spherical.radius += event.deltaY * 0.1
                spherical.radius = Math.max(50, Math.min(1000, spherical.radius))
                camera.position.setFromSpherical(spherical)
                camera.lookAt(0, 0, 0)
            }

            renderer.domElement.addEventListener('mousedown', onMouseDown)
            renderer.domElement.addEventListener('mousemove', onMouseMove)
            renderer.domElement.addEventListener('mouseup', onMouseUp)
            renderer.domElement.addEventListener('wheel', onWheel)
        }

        const updateTrajectory = () => {
            // Only update trajectory if active or if in allowed flight phases
            if (!trajectoryGeometry.value || !props.trajectoryPoints.length) return
            
            // Clear existing markers
            while (trajectoryMarkers.children.length > 0) {
                trajectoryMarkers.remove(trajectoryMarkers.children[0])
            }

            const points = props.trajectoryPoints.map(point =>
                new THREE.Vector3(point.x, point.z, point.y)
            )

            trajectoryGeometry.value.setFromPoints(points)
            trajectoryGeometry.value.computeBoundingBox()
            
            // Create dashed line
            if (trajectoryLine) {
                trajectoryGeometry.value.computeLineDistances()
            }

            // Update trajectory color based on altitude
            const colors = []
            points.forEach((point, index) => {
                const altitude = point.y
                const normalizedAltitude = Math.min(altitude / 1000, 1) // Normalize to 0-1

                // Color gradient from blue (low) to red (high)
                const color = new THREE.Color()
                color.setHSL(0.6 - normalizedAltitude * 0.6, 1, 0.5)
                colors.push(color.r, color.g, color.b)
                
                // Add markers at intervals
                if (index % markerInterval === 0 && index > 0) {
                    const markerGeometry = new THREE.SphereGeometry(0.8, 8, 6)
                    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x42a5f5 })
                    const marker = new THREE.Mesh(markerGeometry, markerMaterial)
                    marker.position.copy(point)
                    trajectoryMarkers.add(marker)
                }
            })

            if (colors.length > 0) {
                trajectoryGeometry.value.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
                trajectoryMaterial.value.vertexColors = true
            }
        }

        const updateVehicle = () => {
            if (!vehicleMesh) return

            const { x, y, altitude } = props.currentPosition
            vehicleMesh.position.set(x, altitude, y)

            // Add some rotation based on movement
            vehicleMesh.rotation.y = Math.atan2(x, y)

            // Add phase-based effects
            switch (props.flightPhase) {
                case 'Powered Ascent':
                    vehicleMesh.material.emissive.setHex(0x553300)
                    break
                case 'Coast':
                    vehicleMesh.material.emissive.setHex(0x113355)
                    break
                case 'Descent':
                    vehicleMesh.material.emissive.setHex(0x331133)
                    break
                default:
                    vehicleMesh.material.emissive.setHex(0x331100)
            }
        }

        const animate = () => {
            if (!animationEnabled.value) {
                animationFrameId = requestAnimationFrame(animate)
                return
            }
            
            // Only update trajectory when appropriate - in active flight phases
            const isFlightActive = props.flightPhase !== 'Pre-Launch' && props.flightPhase !== 'Landed'
            
            // Always update vehicle but only update trajectory when active
            updateVehicle()
            
            // Only update trajectory if test data is active or a real launch is happening
            if (props.isActive || isFlightActive) {
                updateTrajectory()
            }

            renderer.render(scene, camera)
            animationFrameId = requestAnimationFrame(animate)
        }

        const handleResize = () => {
            if (!containerRef.value || !camera || !renderer) return

            const width = containerRef.value.clientWidth
            const height = containerRef.value.clientHeight

            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        }

        const resetCamera = () => {
            if (!camera) return
            camera.position.set(200, 200, 200)
            camera.lookAt(0, 0, 0)
        }

        const toggleAnimation = () => {
            animationEnabled.value = !animationEnabled.value
        }

        const clearTrajectory = () => {
            if (trajectoryGeometry.value) {
                trajectoryGeometry.value.setFromPoints([])
            }
            
            // Clear markers
            while (trajectoryMarkers && trajectoryMarkers.children.length > 0) {
                trajectoryMarkers.remove(trajectoryMarkers.children[0])
            }
        }

        const formatPosition = (position) => {
            return `(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`
        }

        // Watch for changes
        watch(() => props.trajectoryPoints, updateTrajectory, { deep: true })
        watch(() => props.currentPosition, updateVehicle, { deep: true })

        // Watch for isActive changes to clear trajectory when becoming active
        watch(() => props.isActive, (newValue, oldValue) => {
            if (newValue && !oldValue) {
                // If becoming active, clear trajectory to start fresh
                clearTrajectory()
            }
        })

        // Watch flight phase changes to clear trajectory when returning to pre-launch
        watch(() => props.flightPhase, (newPhase, oldPhase) => {
            if (newPhase === 'Pre-Launch' && oldPhase !== 'Pre-Launch') {
                // If returning to pre-launch, clear trajectory
                clearTrajectory()
            }
        })

        onMounted(() => {
            nextTick(() => {
                initThreeJS()
            })
        })

        onUnmounted(() => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
            if (renderer) {
                renderer.dispose()
            }
            window.removeEventListener('resize', handleResize)
        })

        // Computed value to track if the trajectory is actively showing data
        const isShowingTrajectory = computed(() => {
            return props.isActive || (props.flightPhase !== 'Pre-Launch' && props.flightPhase !== 'Landed')
        })
        
        return {
            containerRef,
            animationEnabled,
            currentAltitude,
            currentPhase,
            currentDistance,
            phaseClass,
            resetCamera,
            toggleAnimation,
            clearTrajectory,
            formatPosition,
            isShowingTrajectory
        }
    }
}
</script>

<style scoped>
.trajectory-3d {
    background: rgba(176, 169, 169, 0);
    border-radius: 12px;
    padding: 16px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.trajectory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.trajectory-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.trajectory-header h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: white;
}

.recording-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    padding: 2px 6px;
    background: rgba(255, 0, 0, 0.15);
    color: #ff5252;
    border-radius: 10px;
    animation: pulse 1.5s infinite;
}

.recording-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #ff5252;
}

@keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
}

.trajectory-controls {
    display: flex;
    gap: 8px;
}

.control-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.control-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.trajectory-container {
    flex: 1;
    min-height: 300px;
    border-radius: 8px;
    overflow: hidden;
    background: radial-gradient(circle at center, rgba(10, 10, 10, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%);
}

.trajectory-info {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
}

.info-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
}

.info-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
}

.info-value.phase {
    text-transform: uppercase;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
}

.info-value.phase.pre-launch {
    background: rgba(158, 158, 158, 0.3);
    color: #9e9e9e;
}

.info-value.phase.powered-ascent {
    background: rgba(255, 152, 0, 0.3);
    color: #ff9800;
}

.info-value.phase.coast {
    background: rgba(33, 150, 243, 0.3);
    color: #2196f3;
}

.info-value.phase.descent {
    background: rgba(156, 39, 176, 0.3);
    color: #9c27b0;
}

.info-value.phase.recovery {
    background: rgba(76, 175, 80, 0.3);
    color: #4caf50;
}

/* Responsive design */
@media (max-width: 768px) {
    .trajectory-header {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
    }

    .trajectory-controls {
        justify-content: center;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }
}
</style>
  
