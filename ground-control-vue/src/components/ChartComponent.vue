<template>
    <div class="chart-component">
        <div class="chart-header">
            <h4>{{ title }}</h4>
            <div class="chart-controls">
                <button @click="resetZoom" class="control-btn">Reset Zoom</button>
                <button @click="togglePause" class="control-btn">
                    {{ isPaused ? 'Resume' : 'Pause' }}
                </button>
            </div>
        </div>

        <div class="chart-container">
            <Line v-if="chartType === 'line'" :id="chartId" :data="chartData" :options="mergedOptions" ref="chartRef" />
            <Bar v-else-if="chartType === 'bar'" :id="chartId" :data="chartData" :options="mergedOptions"
                ref="chartRef" />
            <Doughnut v-else-if="chartType === 'doughnut'" :id="chartId" :data="chartData" :options="mergedOptions"
                ref="chartRef" />
        </div>

        <div class="chart-stats" v-if="showStats">
            <div class="stat-item">
                <span class="stat-label">Current:</span>
                <span class="stat-value" :style="{ color: currentValueColor }">
                    {{ formatValue(currentValue) }}
                </span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Min:</span>
                <span class="stat-value">{{ formatValue(minValue) }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Max:</span>
                <span class="stat-value">{{ formatValue(maxValue) }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Avg:</span>
                <span class="stat-value">{{ formatValue(avgValue) }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
} from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import { Line, Bar, Doughnut } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
    zoomPlugin
)

export default {
    name: 'ChartComponent',
    components: {
        Line,
        Bar,
        Doughnut
    },
    props: {
        title: {
            type: String,
            required: true
        },
        data: {
            type: Object,
            required: true
        },
        chartType: {
            type: String,
            default: 'line',
            validator: (value) => ['line', 'bar', 'doughnut'].includes(value)
        },
        options: {
            type: Object,
            default: () => ({})
        },
        showStats: {
            type: Boolean,
            default: true
        },
        unit: {
            type: String,
            default: ''
        },
        precision: {
            type: Number,
            default: 2
        },
        thresholds: {
            type: Object,
            default: () => ({
                warning: null,
                critical: null
            })
        }
    },
    setup(props) {
        const chartRef = ref(null)
        const isPaused = ref(false)
        const chartId = `chart-${Math.random().toString(36).substr(2, 9)}`

        // Computed values for statistics
        const currentValue = computed(() => {
            if (!props.data?.datasets?.[0]?.data?.length) return 0
            const data = props.data.datasets[0].data
            return data[data.length - 1] || 0
        })

        const minValue = computed(() => {
            if (!props.data?.datasets?.[0]?.data?.length) return 0
            return Math.min(...props.data.datasets[0].data.filter(val => val !== null && val !== undefined))
        })

        const maxValue = computed(() => {
            if (!props.data?.datasets?.[0]?.data?.length) return 0
            return Math.max(...props.data.datasets[0].data.filter(val => val !== null && val !== undefined))
        })

        const avgValue = computed(() => {
            if (!props.data?.datasets?.[0]?.data?.length) return 0
            const data = props.data.datasets[0].data.filter(val => val !== null && val !== undefined)
            return data.reduce((sum, val) => sum + val, 0) / data.length
        })

        // Color coding based on thresholds
        const currentValueColor = computed(() => {
            const value = currentValue.value
            const { warning, critical } = props.thresholds

            if (critical !== null && value >= critical) return '#f44336'
            if (warning !== null && value >= warning) return '#ff9800'
            return '#4caf50'
        })

        // Merged chart options
        const mergedOptions = computed(() => {
            const defaultOptions = {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `${props.title}: ${formatValue(context.parsed.y)}`
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x'
                        },
                        zoom: {
                            wheel: {
                                enabled: true
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x'
                        }
                    }
                },
                scales: props.chartType === 'line' ? {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function (value) {
                                return formatTime(value)
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function (value) {
                                return formatValue(value)
                            }
                        }
                    }
                } : {},
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 4
                    },
                    line: {
                        tension: 0.1,
                        borderWidth: 2
                    }
                },
                animation: {
                    duration: isPaused.value ? 0 : 200
                }
            }

            return { ...defaultOptions, ...props.options }
        })

        // Computed chart data with enhancements
        const chartData = computed(() => {
            if (!props.data) return { labels: [], datasets: [] }

            return {
                ...props.data,
                datasets: props.data.datasets.map(dataset => ({
                    ...dataset,
                    fill: true,
                    backgroundColor: dataset.backgroundColor || 'rgba(66, 165, 245, 0.1)',
                    borderColor: dataset.borderColor || '#42A5F5',
                    pointBackgroundColor: dataset.borderColor || '#42A5F5',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1
                }))
            }
        })

        // Methods
        const formatValue = (value) => {
            if (value === null || value === undefined) return '--'
            return `${Number(value).toFixed(props.precision)}${props.unit}`
        }

        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60)
            const secs = Math.floor(seconds % 60)
            return `${minutes}:${secs.toString().padStart(2, '0')}`
        }

        const resetZoom = () => {
            if (chartRef.value?.chart) {
                chartRef.value.chart.resetZoom()
            }
        }

        const togglePause = () => {
            isPaused.value = !isPaused.value
        }

        const updateChart = () => {
            if (chartRef.value?.chart && !isPaused.value) {
                chartRef.value.chart.update('none')
            }
        }

        // Watch for data changes to update chart
        watch(() => props.data, () => {
            nextTick(() => {
                updateChart()
            })
        }, { deep: true })

        onMounted(() => {
            nextTick(() => {
                updateChart()
            })
        })

        return {
            chartRef,
            isPaused,
            chartId,
            currentValue,
            minValue,
            maxValue,
            avgValue,
            currentValueColor,
            mergedOptions,
            chartData,
            formatValue,
            resetZoom,
            togglePause
        }
    }
}
</script>

<style scoped>
.chart-component {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 10px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.chart-header h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: rgb(255, 255, 255);
}

.chart-controls {
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

.chart-container {
    flex: 1;
    position: relative;
    min-height: 200px;
}

.chart-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.stat-label {
    font-size: 0.7rem;
    color: rgba(238, 255, 0, 0.628);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
}

/* Responsive design */
@media (max-width: 600px) {
    .chart-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .chart-header {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
    }

    .chart-controls {
        justify-content: center;
    }
}
</style>