<template>
    <div class="chart-wrapper">
        <div class="chart-header">
            <h3 class="chart-title">{{ title }}</h3>
            <div class="chart-controls" v-if="showControls">
                <button @click="toggleAnimation" class="control-btn">
                    {{ animationEnabled ? 'Pause' : 'Play' }}
                </button>
                <button @click="resetZoom" class="control-btn">Reset Zoom</button>
                <button @click="exportChart" class="control-btn">Export</button>
            </div>
        </div>
        <div class="chart-container">
            <canvas ref="chartCanvas"></canvas>
        </div>
        <div class="chart-stats" v-if="showStats">
            <div class="stat-item">
                <span class="stat-label">Current:</span>
                <span class="stat-value">{{ currentValue }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Max:</span>
                <span class="stat-value">{{ maxValue }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Min:</span>
                <span class="stat-value">{{ minValue }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TimeScale
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import zoomPlugin from 'chartjs-plugin-zoom'

// Register Chart.js components
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TimeScale,
    zoomPlugin
)

const props = defineProps({
    chartData: {
        type: Object,
        required: true
    },
    options: {
        type: Object,
        default: () => ({})
    },
    type: {
        type: String,
        default: 'line'
    },
    title: {
        type: String,
        default: 'Telemetry Chart'
    },
    showControls: {
        type: Boolean,
        default: true
    },
    showStats: {
        type: Boolean,
        default: true
    },
    realTime: {
        type: Boolean,
        default: true
    },
    theme: {
        type: String,
        default: 'dark' // 'dark' or 'light'
    }
})

const chartCanvas = ref(null)
const animationEnabled = ref(true)
let chart = null

// Modern chart configuration
const defaultOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2, // High DPI support

    // Modern animations
    animation: {
        duration: animationEnabled.value ? 750 : 0,
        easing: 'easeInOutQuart'
    },

    // Interactive features
    interaction: {
        intersect: false,
        mode: 'index'
    },

    // Zoom and pan
    plugins: {
        zoom: {
            zoom: {
                wheel: {
                    enabled: true,
                },
                pinch: {
                    enabled: true
                },
                mode: 'x',
            },
            pan: {
                enabled: true,
                mode: 'x',
            }
        },

        // Custom title
        title: {
            display: true,
            text: props.title,
            color: props.theme === 'dark' ? '#00d4ff' : '#1976d2',
            font: {
                family: 'Orbitron',
                size: 16,
                weight: 'bold'
            },
            padding: 20
        },

        // Modern legend
        legend: {
            display: true,
            position: 'top',
            labels: {
                color: props.theme === 'dark' ? '#e3f2fd' : '#333',
                font: {
                    family: 'Roboto',
                    size: 12
                },
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20
            }
        },

        // Enhanced tooltip
        tooltip: {
            enabled: true,
            backgroundColor: props.theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            titleColor: props.theme === 'dark' ? '#00d4ff' : '#1976d2',
            bodyColor: props.theme === 'dark' ? '#e3f2fd' : '#333',
            borderColor: props.theme === 'dark' ? '#00d4ff' : '#1976d2',
            borderWidth: 2,
            cornerRadius: 8,
            displayColors: true,
            titleFont: {
                family: 'Orbitron',
                size: 14,
                weight: 'bold'
            },
            bodyFont: {
                family: 'Roboto',
                size: 12
            },
            callbacks: {
                title: function (context) {
                    return `Time: ${context[0].label}`
                },
                label: function (context) {
                    const label = context.dataset.label || ''
                    const value = context.parsed.y
                    const unit = getUnit(label)
                    return `${label}: ${value.toFixed(2)} ${unit}`
                }
            }
        }
    },

    // Modern scales
    scales: {
        x: {
            type: props.realTime ? 'time' : 'category',
            display: true,
            grid: {
                color: props.theme === 'dark' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                lineWidth: 1
            },
            ticks: {
                color: props.theme === 'dark' ? '#b3e5fc' : '#666',
                font: {
                    family: 'Roboto',
                    size: 11
                },
                maxTicksLimit: 10
            },
            title: {
                display: true,
                text: 'Time',
                color: props.theme === 'dark' ? '#00d4ff' : '#1976d2',
                font: {
                    family: 'Orbitron',
                    size: 12,
                    weight: 'bold'
                }
            }
        },
        y: {
            display: true,
            grid: {
                color: props.theme === 'dark' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                lineWidth: 1
            },
            ticks: {
                color: props.theme === 'dark' ? '#b3e5fc' : '#666',
                font: {
                    family: 'Roboto',
                    size: 11
                },
                callback: function (value) {
                    return value.toFixed(1)
                }
            },
            title: {
                display: true,
                text: getYAxisLabel(),
                color: props.theme === 'dark' ? '#00d4ff' : '#1976d2',
                font: {
                    family: 'Orbitron',
                    size: 12,
                    weight: 'bold'
                }
            }
        }
    }
}))

// Enhanced chart data with modern styling
const enhancedChartData = computed(() => {
    if (!props.chartData || !props.chartData.datasets) return props.chartData

    const enhancedDatasets = props.chartData.datasets.map((dataset, index) => ({
        ...dataset,

        // Modern line styling
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: dataset.borderColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: dataset.borderColor,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,

        // Smooth curves
        tension: 0.4,

        // Fill area with gradient
        fill: dataset.fill !== false,
        backgroundColor: createGradient(dataset.borderColor),

        // Animation delays for multiple datasets
        animation: {
            delay: index * 200
        }
    }))

    return {
        ...props.chartData,
        datasets: enhancedDatasets
    }
})

// Statistics computed properties
const currentValue = computed(() => {
    if (!props.chartData.datasets?.[0]?.data?.length) return 'N/A'
    const data = props.chartData.datasets[0].data
    const latest = data[data.length - 1]
    return typeof latest === 'object' ? latest.y?.toFixed(2) : latest?.toFixed(2)
})

const maxValue = computed(() => {
    if (!props.chartData.datasets?.[0]?.data?.length) return 'N/A'
    const data = props.chartData.datasets[0].data
    const values = data.map(d => typeof d === 'object' ? d.y : d)
    return Math.max(...values).toFixed(2)
})

const minValue = computed(() => {
    if (!props.chartData.datasets?.[0]?.data?.length) return 'N/A'
    const data = props.chartData.datasets[0].data
    const values = data.map(d => typeof d === 'object' ? d.y : d)
    return Math.min(...values).toFixed(2)
})

// Helper functions
const createGradient = (color) => {
    if (!chartCanvas.value) return color

    const ctx = chartCanvas.value.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)

    // Extract RGB from hex color
    const rgb = hexToRgb(color)
    if (rgb) {
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`)
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`)
    }

    return gradient
}

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

const getUnit = (label) => {
    const units = {
        'Altitude': 'm',
        'Velocity': 'm/s',
        'Acceleration': 'm/s²',
        'Temperature': '°C',
        'Pressure': 'hPa',
        'Battery': '%',
        'Signal': 'dBm'
    }

    for (const [key, unit] of Object.entries(units)) {
        if (label.toLowerCase().includes(key.toLowerCase())) {
            return unit
        }
    }
    return ''
}

const getYAxisLabel = () => {
    if (!props.chartData.datasets?.[0]?.label) return 'Value'
    const label = props.chartData.datasets[0].label
    const unit = getUnit(label)
    return unit ? `${label} (${unit})` : label
}

// Chart methods
const toggleAnimation = () => {
    animationEnabled.value = !animationEnabled.value
    if (chart) {
        chart.options.animation.duration = animationEnabled.value ? 750 : 0
        chart.update()
    }
}

const resetZoom = () => {
    if (chart) {
        chart.resetZoom()
    }
}

const exportChart = () => {
    if (chart) {
        const url = chart.toBase64Image('image/png', 1.0)
        const link = document.createElement('a')
        link.download = `${props.title.replace(/\s+/g, '_')}_chart.png`
        link.href = url
        link.click()
    }
}

// Lifecycle
onMounted(() => {
    if (chartCanvas.value) {
        const ctx = chartCanvas.value.getContext('2d')

        chart = new Chart(ctx, {
            type: props.type,
            data: enhancedChartData.value,
            options: { ...defaultOptions.value, ...props.options }
        })
    }
})

watch(() => props.chartData, (newData) => {
    if (chart && newData) {
        // Update data with smooth animation
        chart.data = enhancedChartData.value
        chart.update(animationEnabled.value ? 'active' : 'none')
    }
}, { deep: true })

watch(() => props.options, (newOptions) => {
    if (chart && newOptions) {
        chart.options = { ...defaultOptions.value, ...newOptions }
        chart.update()
    }
}, { deep: true })

onUnmounted(() => {
    if (chart) {
        chart.destroy()
    }
})
</script>

<style scoped>
.chart-wrapper {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    border: 1px solid rgba(0, 212, 255, 0.3);
    padding: 1rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}

.chart-title {
    font-family: 'Orbitron', monospace;
    font-size: 1.1rem;
    color: #00d4ff;
    margin: 0;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

.chart-controls {
    display: flex;
    gap: 0.5rem;
}

.control-btn {
    padding: 0.4rem 0.8rem;
    background: rgba(0, 212, 255, 0.2);
    border: 1px solid #00d4ff;
    border-radius: 6px;
    color: #00d4ff;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.3s ease;
    font-family: 'Roboto', sans-serif;
}

.control-btn:hover {
    background: rgba(0, 212, 255, 0.4);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.chart-container {
    position: relative;
    height: 300px;
    margin: 1rem 0;
}

.chart-stats {
    display: flex;
    justify-content: space-around;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0, 212, 255, 0.2);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.stat-label {
    font-size: 0.8rem;
    color: #b3e5fc;
    text-transform: uppercase;
    font-weight: 500;
}

.stat-value {
    font-family: 'Orbitron', monospace;
    font-size: 1rem;
    color: #00d4ff;
    font-weight: 700;
}

/* Responsive design */
@media (max-width: 768px) {
    .chart-header {
        flex-direction: column;
        gap: 0.5rem;
        align-items: stretch;
    }

    .chart-controls {
        justify-content: center;
    }

    .chart-stats {
        flex-direction: column;
        gap: 0.5rem;
    }

    .stat-item {
        flex-direction: row;
        justify-content: space-between;
    }
}

/* Animation classes */
.chart-wrapper {
    animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Loading state */
.chart-wrapper.loading {
    position: relative;
}

.chart-wrapper.loading::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    z-index: 10;
}

.chart-wrapper.loading::after {
    content: 'Loading...';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #00d4ff;
    font-family: 'Orbitron', monospace;
    z-index: 11;
}
</style>
  
