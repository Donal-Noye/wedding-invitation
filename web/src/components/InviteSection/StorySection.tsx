import { useEffect, useRef, useState } from 'react'
import styles from './StorySection.module.css'

export type StorySlide = {
    photo: string
    title: string
    text: string
}

const ANIM_MS = 1200 // длительность перехода между слайдами (совпадает с CSS)
const SNAP_MS = 700  // как быстро страница «доезжает» до секции
const QUIET_MS = 120 // пауза без прокрутки, после которой принимается новое движение

function usePrefersReducedMotion() {
    const [reduce, setReduce] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const onChange = () => setReduce(mq.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])
    return reduce
}

// Плавная прокрутка страницы к нужной позиции
function scrollToY(y: number, ms: number, done: () => void) {
    const from = window.scrollY
    const start = performance.now()
    const tick = (now: number) => {
        const t = Math.min(1, (now - start) / ms)
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        window.scrollTo({ top: from + (y - from) * eased, behavior: 'instant' })
        if (t < 1) requestAnimationFrame(tick)
        else done()
    }
    requestAnimationFrame(tick)
}

export function StorySection({ slides, chapter = 'Глава I' }: { slides: StorySlide[]; chapter?: string }) {
    const ref = useRef<HTMLElement>(null)
    const [index, setIndex] = useState(0)
    const reduce = usePrefersReducedMotion()
    const count = slides.length

    useEffect(() => {
        if (reduce || count < 2) return

        let alive = true
        let locked = false  // идёт переход: новые движения игнорируются
        let current = 0     // зеркало index для обработчиков
        let lastWheel = 0
        let touchY = 0
        let touchDone = false

        // Снимаем блокировку, только когда прокрутка «затихла» (иначе инерция тачпада листает дальше)
        const release = () => {
            if (!alive) return
            if (performance.now() - lastWheel > QUIET_MS) locked = false
            else setTimeout(release, 60)
        }
        const lockFor = (ms: number) => {
            locked = true
            setTimeout(release, ms)
        }
        const goTo = (i: number) => {
            current = i
            setIndex(i)
        }

        // true, если секция забрала движение себе; false, если страница должна прокручиваться как обычно
        const intent = (dir: 1 | -1): boolean => {
            if (document.documentElement.dataset.pageScrolling) return true

            const el = ref.current
            if (!el) return false
            if (locked) return true

            const rect = el.getBoundingClientRect()
            const vh = window.innerHeight

            if (Math.abs(rect.top) <= 2) { // секция на месте: листаем слайды
                const next = current + dir
                if (next < 0 || next >= count) return false // крайний слайд: выпускаем страницу
                goTo(next)
                lockFor(ANIM_MS)
                return true
            }

            // секция рядом: подтягиваем её на место
            const fromAbove = dir > 0 && rect.top > 0 && rect.top < vh * 0.5
            const fromBelow = dir < 0 && rect.top < 0 && rect.top > -vh * 0.5
            if (fromAbove || fromBelow) {
                goTo(fromAbove ? 0 : count - 1)
                locked = true
                scrollToY(window.scrollY + rect.top, SNAP_MS, () => lockFor(300))
                return true
            }
            return false
        }

        const onWheel = (e: WheelEvent) => {
            lastWheel = performance.now()
            if (Math.abs(e.deltaY) < 1) return
            if (intent(e.deltaY > 0 ? 1 : -1)) e.preventDefault()
        }

        const onTouchStart = (e: TouchEvent) => {
            touchY = e.touches[0].clientY
            touchDone = false
        }
        const onTouchMove = (e: TouchEvent) => {
            const el = ref.current
            if (!el) return
            const dy = touchY - e.touches[0].clientY
            const dir = dy > 0 ? 1 : -1
            const aligned = Math.abs(el.getBoundingClientRect().top) <= 2
            const canStep = aligned && current + dir >= 0 && current + dir < count
            if (locked || canStep) e.preventDefault() // не даём странице ехать, пока листаем слайды
            if (!touchDone && Math.abs(dy) > 40) {
                touchDone = true
                intent(dir)
            }
        }

        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
            const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key)
                ? 1
                : ['ArrowUp', 'PageUp'].includes(e.key)
                    ? -1
                    : 0
            if (dir && intent(dir)) e.preventDefault()
        }

        window.addEventListener('wheel', onWheel, { passive: false })
        window.addEventListener('touchstart', onTouchStart, { passive: true })
        window.addEventListener('touchmove', onTouchMove, { passive: false })
        window.addEventListener('keydown', onKey)
        return () => {
            alive = false
            window.removeEventListener('wheel', onWheel)
            window.removeEventListener('touchstart', onTouchStart)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('keydown', onKey)
        }
    }, [reduce, count])

    if (count === 0) return null

    // Без анимации: обычный список слайдов
    if (reduce) {
        return (
            <section className={styles.plain}>
                {slides.map((slide) => (
                    <article key={slide.title} className={styles.plainItem}>
                        <img src={slide.photo} alt="" />
                        <h2>{slide.title}</h2>
                        <p>{slide.text}</p>
                    </article>
                ))}
            </section>
        )
    }

    const stateOf = (i: number) => (i < index ? 'gone' : i === index ? 'active' : 'next')

    return (
        <section ref={ref} className="story" id="story">
            <div className={styles.stage}>
                <div className={styles.media}>
                    {slides.map((slide, i) => (
                        <img key={slide.title} className={styles.photo} data-state={stateOf(i)} src={slide.photo} alt="" />
                    ))}
                </div>

                <div className={styles.copy}>
                    <p className={styles.chapter}>{chapter}</p>
                    <div className={styles.texts}>
                        {slides.map((slide, i) => (
                            <div key={slide.title} className={styles.text} data-state={stateOf(i)} aria-hidden={i !== index}>
                                <h2>{slide.title}</h2>
                                <p>{slide.text}</p>
                            </div>
                        ))}
                    </div>
                </div>


            </div>
        </section>
    )
}
