import { useEffect } from 'react'

const DURATION_MS = 1000  // длительность перехода между секциями
const QUIET_MS = 120      // пауза без прокрутки, после которой принимается новый жест

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function useSectionScroll(selector = 'main > section, main > footer') {
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        let alive = true
        let locked = false
        let lastWheel = 0
        let touchY = 0
        let touchDone = false
        const root = document.documentElement

        const sections = () => Array.from(document.querySelectorAll<HTMLElement>(selector))

        // секция, верх которой ближе всего к верху окна
        const currentIndex = (list: HTMLElement[]) => {
            let best = 0
            let bestDist = Infinity
            list.forEach((el, i) => {
                const dist = Math.abs(el.getBoundingClientRect().top)
                if (dist < bestDist) {
                    best = i
                    bestDist = dist
                }
            })
            return best
        }

        // Секция выше экрана (например, длинная форма): пока не дошли до её края, прокручиваем как обычно
        const scrollsNatively = (el: HTMLElement, dir: 1 | -1) => {
            const rect = el.getBoundingClientRect()
            return dir > 0 ? rect.bottom > window.innerHeight + 2 : rect.top < -2
        }

        const release = () => {
            if (!alive) return
            if (performance.now() - lastWheel > QUIET_MS) {
                locked = false
                delete root.dataset.pageScrolling
            } else {
                setTimeout(release, 60)
            }
        }

        // true, если мы сами перелистываем; false, если страница должна прокручиваться как обычно
        const go = (dir: 1 | -1): boolean => {
            if (locked) return true
            const list = sections()
            const index = currentIndex(list)
            if (scrollsNatively(list[index], dir)) return false
            const target = list[index + dir]
            if (!target) return false

            locked = true
            root.dataset.pageScrolling = '1' // сигнал для StorySection: не вмешиваться
            const from = window.scrollY
            const to = from + target.getBoundingClientRect().top
            const start = performance.now()

            const tick = (now: number) => {
                const t = Math.min(1, (now - start) / DURATION_MS)
                window.scrollTo({ top: from + (to - from) * easeInOut(t), behavior: 'instant' })
                if (t < 1) requestAnimationFrame(tick)
                else setTimeout(release, 200)
            }
            requestAnimationFrame(tick)
            return true
        }

        const onWheel = (e: WheelEvent) => {
            if (e.defaultPrevented || Math.abs(e.deltaY) < 1) return // StorySection уже забрал движение
            lastWheel = performance.now()
            if (go(e.deltaY > 0 ? 1 : -1)) e.preventDefault()
        }

        const onTouchStart = (e: TouchEvent) => {
            touchY = e.touches[0].clientY
            touchDone = false
        }
        const onTouchMove = (e: TouchEvent) => {
            if (e.defaultPrevented) return
            const dy = touchY - e.touches[0].clientY
            const dir = dy > 0 ? 1 : -1
            if (locked) {
                e.preventDefault()
                return
            }
            if (!touchDone && Math.abs(dy) > 40) {
                touchDone = true
                if (go(dir)) e.preventDefault()
            }
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.defaultPrevented) return
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
            const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key)
                ? 1
                : ['ArrowUp', 'PageUp'].includes(e.key)
                    ? -1
                    : 0
            if (dir && go(dir)) e.preventDefault()
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
            delete root.dataset.pageScrolling
        }
    }, [selector])
}