import {type CSSProperties, useEffect, useMemo, useRef, useState} from 'react'
import styles from './RoadmapSection.module.css'

export type RoadmapItem = {
    time: string
    title: string
    note: string
    place?: string // необязательно: «где» это происходит
}

const ROW = 60 // высота одного этапа в единицах SVG; больше значит длиннее дорога
const LEFT_X = 24
const RIGHT_X = 76
const GAP = 80
const REVEAL_AHEAD = 28 // насколько заранее появляется текст (в единицах SVG; ROW = 60 это целый этап)
const START_AT = 0.85 // с какой доли высоты экрана начинает рисоваться линия (больше значит раньше)

export function RoadmapSection({items, title = 'Дорожная карта', chapter = "Глава II"}: {
    items: RoadmapItem[];
    title?: string,
    chapter?: string
}) {
    const boxRef = useRef<HTMLDivElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const dotRef = useRef<SVGCircleElement>(null)
    const [active, setActive] = useState(0) // сколько этапов уже «проехали»

    const height = items.length * ROW

    // Координаты этапов: зигзаг слева направо; дорога стартует сверху по центру и заканчивается внизу по центру
    const stops = useMemo(
        () => items.map((_, i) => ({x: i % 2 === 0 ? LEFT_X : RIGHT_X, y: ROW * (i + 0.5)})),
        [items],
    )
    const d = useMemo(() => {
        const pts = [{x: 50, y: 0}, ...stops, {x: 50, y: height}]
        let path = `M ${pts[0].x} ${pts[0].y}`
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1]
            const b = pts[i]
            const mid = (a.y + b.y) / 2
            path += ` C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}` // плавная S-кривая
        }
        return path
    }, [stops, height])

    useEffect(() => {
        const box = boxRef.current
        const path = pathRef.current
        const dot = dotRef.current
        if (!box || !path || !dot || items.length === 0) return

        const length = path.getTotalLength()
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        path.style.strokeDasharray = `${length}`
        let raf = 0
        let lastActive = -1

        const update = () => {
            raf = 0
            const rect = box.getBoundingClientRect()
            const p = reduce ? 1 : Math.min(1, Math.max(0, (window.innerHeight * START_AT - rect.top) / rect.height))
            path.style.strokeDashoffset = `${length * (1 - p)}`

            const tip = path.getPointAtLength(length * p)
            dot.setAttribute('cx', String(tip.x))
            dot.setAttribute('cy', String(tip.y))
            dot.style.opacity = p > 0 && p < 1 ? '1' : '0'

            const reached = stops.filter((s) => tip.y >= s.y - REVEAL_AHEAD).length
            if (reached !== lastActive) {
                lastActive = reached
                setActive(reached)
            }
        }
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update)
        }

        update()
        window.addEventListener('scroll', onScroll, {passive: true})
        window.addEventListener('resize', onScroll)
        return () => {
            if (raf) cancelAnimationFrame(raf)
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
        }
    }, [stops, items.length])

    return (
        <section className={styles.roadmap}>
            <div className="copy">
                <p className="chapter">{chapter}</p>
                <h2>{title}</h2>
            </div>

            <div ref={boxRef} className={styles.road} style={{'--h': height} as CSSProperties}>
                <svg viewBox={`0 0 100 ${height}`} className={styles.svg} aria-hidden="true">
                    <path d={d} className={styles.track}/>
                    <path ref={pathRef} d={d} className={styles.line}/>
                    {stops.map((s, i) => (
                        <circle key={i} cx={s.x} cy={s.y} r="1.8" className={styles.stopDot} data-active={i < active}/>
                    ))}
                    <circle ref={dotRef} r="2.4" className={styles.traveler}/>
                </svg>

                {items.map((item, i) => {
                    const s = stops[i]
                    const onLeft = s.x === LEFT_X // точка слева, текст справа от неё
                    const style: CSSProperties = {
                        top: `${(s.y / height) * 100}%`,
                        ...(onLeft ? { left: `calc(${s.x}% + ${GAP}px)` } : { right: `calc(${100 - s.x}% + ${GAP}px)` }),
                    }
                    return (
                        <div
                            key={item.time + item.title}
                            className={styles.stop}
                            data-side={onLeft ? 'right' : 'left'}
                            data-active={i < active}
                            style={style}
                        >
                            <time>{item.time}</time>
                            <h3>{item.title}</h3>
                            {item.place && <p className={styles.place}>{item.place}</p>}
                            <p>{item.note}</p>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}