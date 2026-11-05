import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 200
const SIZE = 1.8              // множитель размера частиц: 1 = обычный, 2 = вдвое больше
const BAND_THICKNESS = 0.34 // толщина полосы, доля высоты экрана
const BAND_TILT = 0.22      // наклон: насколько полоса поднимается к правому краю
const WAVE_AMP = 0.05       // высота волны, доля высоты экрана
const COLORS = ['255, 200, 140', '232, 170, 100', '255, 235, 210']

type Particle = {
    x: number
    offset: number
    z: number
    radius: number
    alpha: number
    phase: number
    drift: number
    color: string
}

export function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const canvasElement: HTMLCanvasElement = canvas

        const context = canvas.getContext('2d')
        if (!context) return
        const ctx: CanvasRenderingContext2D = context

        let width = 0
        let height = 0
        let particles: Particle[] = []
        let animationId = 0
        let lastTime = 0
        let isVisible = !document.hidden
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

        function bandY(x: number, time: number) {
            const t = x / width
            return (
                height * (0.68 - BAND_TILT * t) +
                Math.sin(t * 5 + time * 0.0003) * height * WAVE_AMP
            )
        }

        function createParticles() {
            const count = Math.min(PARTICLE_COUNT, Math.floor((width * height) / 7000))

            particles = Array.from({ length: count }, () => {
                const big = Math.random() < 0.3
                // сумма трёх случайных чисел даёт пик в центре: больше частиц у оси полосы
                const spread = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
                return {
                    x: Math.random() * width,
                    offset: spread * height * BAND_THICKNESS,
                    z: 0.3 + Math.random() * 0.7,
                    radius: big ? 8 + Math.random() * 14 : 1.5 + Math.random() * 3,
                    alpha: big ? 0.1 + Math.random() * 0.15 : 0.4 + Math.random() * 0.5,
                    phase: Math.random() * Math.PI * 2,
                    drift: 0.3 + Math.random() * 0.7,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                }
            })
        }

        function render(time: number, move = true) {
            ctx.clearRect(0, 0, width, height)
            const elapsed = lastTime ? Math.min(time - lastTime, 32) : 16
            lastTime = time

            for (const p of particles) {
                if (move && !reduceMotion.matches) {
                    p.x += 0.02 * p.z * p.drift * elapsed // вдоль полосы
                    p.offset += Math.sin(time * 0.0004 + p.phase) * 0.02 * p.z * elapsed // покачивание
                    if (p.x > width + 20) p.x = -20
                }

                const y = bandY(p.x, time) + p.offset

                // растворяются у краёв экрана
                const edge = Math.max(0, Math.min(1, p.x / (width * 0.15), (width - p.x) / (width * 0.15)))
                // ярче у оси полосы, слабее на периферии
                const core = 1 - 0.6 * Math.min(1, Math.abs(p.offset) / (height * BAND_THICKNESS * 1.2))

                const twinkle = 0.85 + 0.15 * Math.sin(time * 0.0005 + p.phase)
                const alpha = p.alpha * twinkle * edge * core
                const radius = p.radius * (0.7 + p.z * 0.5) * SIZE

                const g = ctx.createRadialGradient(p.x, y, 0, p.x, y, radius)
                g.addColorStop(0, `rgba(${p.color}, ${alpha})`)
                g.addColorStop(1, `rgba(${p.color}, 0)`)

                ctx.beginPath()
                ctx.fillStyle = g
                ctx.arc(p.x, y, radius, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const widthChanged = window.innerWidth !== width

            width = window.innerWidth
            height = window.innerHeight
            canvasElement.width = Math.round(width * dpr)
            canvasElement.height = Math.round(height * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            // на телефонах resize срабатывает при скрытии адресной строки:
            // частицы пересоздаём, только если изменилась ширина
            if (widthChanged || particles.length === 0) createParticles()

            render(0, false)
        }

        function animate(time: number) {
            render(time)
            animationId = requestAnimationFrame(animate)
        }

        function start() {
            cancelAnimationFrame(animationId)
            lastTime = 0
            if (!isVisible) return
            if (reduceMotion.matches) {
                render(0, false)
                return
            }
            animationId = requestAnimationFrame(animate)
        }

        function handleVisibilityChange() {
            isVisible = !document.hidden
            if (isVisible) start()
            else cancelAnimationFrame(animationId)
        }

        window.addEventListener('resize', resize)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        reduceMotion.addEventListener('change', start)
        resize()
        start()

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', resize)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            reduceMotion.removeEventListener('change', start)
        }
    }, [])

    return <canvas ref={canvasRef} className="particles" aria-hidden="true" />
}
