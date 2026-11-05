import { useEffect, useRef, useState, type CSSProperties } from 'react'
import styles from './DresscodeSection.module.css'

export type DressCode = {
    title: string
    text: string
    colors: { name: string; hex: string }[] // лоскуты палитры
    do: string[]                            // «Да»
    avoid: string[]                         // «Лучше не надо»
}

export function DresscodeSection({ data }: { data: DressCode }) {
    const ref = useRef<HTMLElement>(null)
    const [visible, setVisible] = useState(false)

    // Лоскуты «повисают» один раз, когда секция заметно появилась на экране
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.4 },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <section ref={ref} className={styles.dress} data-visible={visible}>
            <div className="container">
                <div className="copy">
                    <p className="chapter">Глава III</p>
                    <h2>{data.title}</h2>
                    <p className={styles.text}>{data.text}</p>
                </div>

                <div className={styles.swatches}>
                    {data.colors.map((color, i) => (
                        <div
                            key={color.hex}
                            className={styles.swatch}
                            style={
                                {
                                    '--c': color.hex,
                                    '--i': i,
                                    '--tilt': `${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg`,
                                } as CSSProperties
                            }
                        >
                            <div className={styles.cloth} />
                            <span>{color.name}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.columns}>
                    <div className={`${styles.col} ${styles.yes}`}>
                        <h3>Да</h3>
                        <ul>
                            {data.do.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <div className={`${styles.col} ${styles.no}`}>
                        <h3>Лучше не надо</h3>
                        <ul>
                            {data.avoid.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}