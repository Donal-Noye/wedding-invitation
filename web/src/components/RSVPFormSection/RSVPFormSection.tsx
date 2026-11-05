import {type FormEvent, useEffect, useState} from 'react'
import {submitRSVP} from '../../api'
import styles from './RSVPFormSection.module.css'

type Answers = {
    name: string
    attending: boolean
    guests: number
    fish: string
    meat: string
    alcohol: string
    allergies: string
}

const initialAnswers: Answers = {
    name: '',
    attending: true,
    guests: 1,
    fish: '',
    meat: '',
    alcohol: '',
    allergies: '',
}

type StepId = 'name' | 'attending' | 'guests' | 'fish' | 'meat' | 'alcohol' | 'comment'

const STEP_MS = 500 // длительность смены шага (совпадает с 0.5s в CSS)

// Вопросы с выбором из вариантов: ответ засчитывается сразу по нажатию
const CHOICES = {
    fish: {question: 'Рыбу едите? Скажите честно.', options: [['yes', 'Да'], ['no', 'Нет']]},
    meat: {question: 'А мясо?', options: [['yes', 'Конечно'], ['no', 'Я вегетарианец']]},
    alcohol: {question: 'Что с алкоголем?', options: [['yes', 'Да'], ['little', 'Чуть-чуть'], ['no', 'Нет']]},
} as const

export function RSVPFormSection({slug}: { slug: string }) {
    const [answers, setAnswers] = useState<Answers>(initialAnswers)
    const [step, setStep] = useState(0)
    const [leaving, setLeaving] = useState<StepId | null>(null) // шаг, который сейчас уходит
    const [dir, setDir] = useState<'next' | 'back'>('next')
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Если гость не придёт, вопросы про гостей и еду пропускаются
    const steps: StepId[] = answers.attending
        ? ['name', 'attending', 'guests', 'fish', 'meat', 'alcohol', 'comment']
        : ['name', 'attending', 'comment']
    const id = steps[Math.min(step, steps.length - 1)]
    const isLast = step >= steps.length - 1

    // Убираем уходящий шаг после окончания анимации
    useEffect(() => {
        if (!leaving) return
        const timer = setTimeout(() => setLeaving(null), STEP_MS)
        return () => clearTimeout(timer)
    }, [leaving, step])

    function go(delta: 1 | -1) {
        setLeaving(id)
        setDir(delta > 0 ? 'next' : 'back')
        setStep((current) => Math.max(0, current + delta))
    }

    function update<K extends keyof Answers>(key: K, value: Answers[K]) {
        setAnswers((current) => ({...current, [key]: value}))
    }

    // Ответ на вопрос с кнопками: записываем и через мгновение идём дальше
    function choose<K extends keyof Answers>(key: K, value: Answers[K]) {
        update(key, value)
        setTimeout(() => go(1), 180)
    }

    async function send() {
        setSubmitting(true)
        setError('')
        const name = answers.name.trim()
        try {
            await submitRSVP(
                answers.attending
                    ? {slug, ...answers, name}
                    : {
                        slug,
                        name,
                        attending: false,
                        guests: 1,
                        fish: '',
                        meat: '',
                        alcohol: '',
                        allergies: answers.allergies
                    },
            )
            setSent(true)
        } catch {
            setError('Не удалось отправить ответ. Проверьте соединение и попробуйте ещё раз.')
        } finally {
            setSubmitting(false)
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (id === 'name' && !answers.name.trim()) return
        if (isLast) void send()
        else go(1)
    }

    // Содержимое шага. ghost = копия уходящего шага (без автофокуса)
    function renderStep(stepId: StepId, ghost = false) {
        return (
            <>
                {stepId === 'name' && (
                    <>
                        <h3>Как вас зовут?</h3>
                        <input
                            className={styles.input}
                            value={answers.name}
                            onChange={(event) => update('name', event.target.value)}
                            placeholder="Имя и фамилия"
                            autoComplete="name"
                            autoFocus={!ghost}
                        />
                        <button className={styles.next} type="submit" disabled={!answers.name.trim()}>Дальше</button>
                    </>
                )}

                {stepId === 'attending' && (
                    <>
                        <h3>Придёте на нашу свадьбу?</h3>
                        <div className={styles.options}>
                            <button type="button" data-on={answers.attending}
                                    onClick={() => choose('attending', true)}>Конечно!
                            </button>
                            <button type="button" data-on={!answers.attending}
                                    onClick={() => choose('attending', false)}>К сожалению, не смогу
                            </button>
                        </div>
                    </>
                )}

                {stepId === 'guests' && (
                    <>
                        <h3>Сколько вас будет?</h3>
                        <p className={styles.hint}>Считая вас</p>
                        <div className={styles.counter}>
                            <button type="button" aria-label="Меньше" disabled={answers.guests <= 1}
                                    onClick={() => update('guests', answers.guests - 1)}>−
                            </button>
                            <b>{answers.guests}</b>
                            <button type="button" aria-label="Больше" disabled={answers.guests >= 5}
                                    onClick={() => update('guests', answers.guests + 1)}>+
                            </button>
                        </div>
                        <button className={styles.next} type="submit">Дальше</button>
                    </>
                )}

                {(stepId === 'fish' || stepId === 'meat' || stepId === 'alcohol') && (
                    <>
                        <h3>{CHOICES[stepId].question}</h3>
                        <div className={styles.options}>
                            {CHOICES[stepId].options.map(([value, label]) => (
                                <button key={value} type="button" data-on={answers[stepId] === value}
                                        onClick={() => choose(stepId, value)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {stepId === 'comment' && (
                    <>
                        <h3>{answers.attending ? 'Аллергии и пожелания?' : 'Пара тёплых слов?'}</h3>
                        <p className={styles.hint}>Необязательно</p>
                        <textarea
                            className={styles.input}
                            rows={3}
                            value={answers.allergies}
                            onChange={(event) => update('allergies', event.target.value)}
                            placeholder={answers.attending ? 'Например: орехи, лактоза, хочу много торта' : 'Что-нибудь молодожёнам'}
                        />
                        {error && !ghost && <p className={styles.error} role="alert">{error}</p>}
                        <button className={styles.next} type="submit" disabled={submitting}>
                            {submitting ? 'Отправляем…' : answers.attending ? 'Подтвердить присутствие' : 'Отправить ответ'}
                        </button>
                    </>
                )}
            </>
        )
    }

    return (
        <>
            <section>
                <div className="container">
                    <div className="copy">
                        <p className="chapter">Глава IV</p>
                        <h2>Подтвердите приглашение</h2>
                        <p className="note">Чтобы повара не гадали, а мы не считали гостей по тостам.</p>
                    </div>
                    <div className={styles.body}>
                        {sent ? (
                            <div className={styles.thanks}>
                                <svg viewBox="0 0 52 52" aria-hidden="true">
                                    <circle cx="26" cy="26" r="24"/>
                                    <path d="M15 27 l8 8 l15 -17"/>
                                </svg>
                                <p>
                                    {answers.attending
                                        ? `Спасибо, ${answers.name.trim()}! Мы вас записали. Ждём вас и ваше хорошее настроение.`
                                        : `Спасибо, ${answers.name.trim()}, что сообщили. Нам будет вас не хватать!`}
                                </p>
                            </div>
                        ) : (
                            <form className={styles.form} onSubmit={handleSubmit}>
                                {/* Оба шага лежат в одной ячейке: старый уходит, новый приходит одновременно */}
                                <div className={styles.stage}>
                                    {leaving && (
                                        <div key={`out-${leaving}`} className={styles.step} data-anim="out"
                                             data-dir={dir}
                                             aria-hidden="true">
                                            {renderStep(leaving, true)}
                                        </div>
                                    )}
                                    <div key={id} className={styles.step} data-anim="in" data-dir={dir}
                                         aria-live="polite">
                                        {renderStep(id)}
                                    </div>
                                </div>

                                <div className={styles.nav}>
                                    <button type="button" className={styles.back} onClick={() => go(-1)}
                                            disabled={step === 0}>←
                                        Назад
                                    </button>
                                    <div className={styles.dots} aria-hidden="true">
                                        {steps.map((s, i) => <span key={s} data-active={i === step}
                                                                   data-done={i < step}/>)}
                                    </div>
                                    <span className={styles.counterText}>{step + 1} / {steps.length}</span>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </>
    )
}