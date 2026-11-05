import styles from './Hero.module.css'
import type {Invitation} from "../../api.ts";
import {ParticleBackground} from "../ParticleBackground.tsx";
import {useState} from "react";

type TimeUnit = readonly [value: number, label: string]

export function Hero({invitation, dateText, timeUnits}: { invitation: Invitation, dateText: string, timeUnits: readonly TimeUnit[]}) {
    const [isRipple, setIsRipple] = useState(false)

    function handleClick() {
        setIsRipple(false)

        requestAnimationFrame(() => {
            setIsRipple(true)
        })

        setTimeout(() => {
            document.getElementById('story')?.scrollIntoView({
                behavior: 'smooth',
            })
        }, 500)

        setTimeout(() => {
            setIsRipple(false)
        }, 2500)
    }

    return (
        <section className={styles.hero}>
            <ParticleBackground />
            <div className={`container ${styles.content}`}>
                {/*<h1 className={styles.heroNames}>{invitation.bride} и {invitation.groom}</h1>*/}
                <h1 className={styles.heroNames}>Салават и Вероника</h1>
                <p className={styles.date}>{dateText}</p>
                <p className={styles.lead}>{invitation.hero.lead}</p>
                <div className={styles.timer} aria-label="Время до свадьбы">
                    {timeUnits.map(([value, label]) => (
                        <div key={label}><b>{String(value).padStart(2, '0')}</b><span>{label}</span></div>
                    ))}
                </div>
            </div>
            <button
                className={`${styles.scrollButton} ${isRipple ? styles.ripple : ''}`}
                onClick={handleClick}
                aria-label="Перейти к деталям свадьбы"
            >
                <span>Детали торжества</span>
                <span className={styles.arrow}>↓</span>
            </button>
        </section>
    )
}