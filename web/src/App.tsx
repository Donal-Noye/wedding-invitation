import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

const INVITATION_SLUG = 'anna-ivan'

type Invitation = {
    slug: string
    bride: string
    groom: string
    wedding_date: string
    hero: { bride_photo: string; groom_photo: string; lead: string }
    invite_text: { title: string; text: string; photo: string }
    location: { title: string; venue: string; address: string; note: string; map_url: string }
    schedule_items: { time: string; title: string; note: string }[]
}

function useCountdown(target: Date) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [])
    const diff = Math.max(0, target.getTime() - now)
    return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor(diff / 3_600_000) % 24,
        minutes: Math.floor(diff / 60_000) % 60,
        seconds: Math.floor(diff / 1000) % 60,
    }
}

type Answers = {
    name: string
    guests: number
    fish: string
    meat: string
    alcohol: string
    allergies: string
}

const initial: Answers = { name: '', guests: 1, fish: '', meat: '', alcohol: '', allergies: '' }

function Choice(props: {
    legend: string
    name: keyof Answers
    options: [string, string][]
    value: string
    onChange: (name: keyof Answers, value: string) => void
}) {
    return (
        <fieldset className="choice">
            <legend>{props.legend}</legend>
            <div className="choice-row">
                {props.options.map(([value, label]) => (
                    <label key={value} className={props.value === value ? 'pill on' : 'pill'}>
                        <input type="radio" name={props.name} value={value} checked={props.value === value}
                               onChange={() => props.onChange(props.name, value)} required />
                        {label}
                    </label>
                ))}
            </div>
        </fieldset>
    )
}

export default function App() {
    const [invitation, setInvitation] = useState<Invitation | null>(null)
    const [loadError, setLoadError] = useState('')
    const [answers, setAnswers] = useState<Answers>(initial)
    const [sent, setSent] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const left = useCountdown(new Date(invitation?.wedding_date ?? 0))

    useEffect(() => {
        fetch(`/api/invitation/${INVITATION_SLUG}`)
            .then(async (response) => {
                if (!response.ok) throw new Error(await response.text())
                return response.json() as Promise<Invitation>
            })
            .then(setInvitation)
            .catch(() => setLoadError('Не удалось загрузить приглашение. Попробуйте обновить страницу.'))
    }, [])

    const set = (name: keyof Answers, value: string | number) =>
        setAnswers((current) => ({ ...current, [name]: value }))

    async function submit(event: FormEvent) {
        event.preventDefault()
        if (!invitation) return

        setSubmitting(true)
        setSubmitError('')
        try {
            const response = await fetch('/api/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: invitation.slug, attending: true, ...answers }),
            })
            if (!response.ok) throw new Error(await response.text())
            setSent(true)
        } catch {
            setSubmitError('Не удалось отправить ответ. Проверьте соединение и попробуйте ещё раз.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loadError) return <main><p role="alert">{loadError}</p></main>
    if (!invitation) return <main><p>Загружаем приглашение…</p></main>

    const date = new Date(invitation.wedding_date)
    const dateText = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

    return (
        <main>
            <section className="hero">
                <div className="photos">
                    <img src={invitation.hero.bride_photo} alt={invitation.bride} />
                    <img src={invitation.hero.groom_photo} alt={invitation.groom} />
                </div>
                <h1>{invitation.bride} и {invitation.groom}</h1>
                <p className="date">{dateText}</p>
                <p className="lead">{invitation.hero.lead}</p>
                <div className="timer" aria-label="Время до свадьбы">
                    {[[left.days, 'дней'], [left.hours, 'часов'], [left.minutes, 'минут'], [left.seconds, 'секунд']].map(([value, label]) => (
                        <div key={label}><b>{String(value).padStart(2, '0')}</b><span>{label}</span></div>
                    ))}
                </div>
            </section>

            <section>
                <h2>{invitation.invite_text.title}</h2>
                <img className="wide" src={invitation.invite_text.photo} alt={`${invitation.bride} и ${invitation.groom}`} />
                <p>{invitation.invite_text.text}</p>
            </section>

            <section>
                <h2>Где и когда</h2>
                <p className="big">{invitation.location.title}</p>
                <p>{invitation.location.venue}, {invitation.location.address}</p>
                <p className="note">{invitation.location.note}</p>
                <a className="link" href={invitation.location.map_url} target="_blank" rel="noreferrer">Открыть на карте</a>
            </section>

            <section>
                <h2>Расписание дня</h2>
                <ol className="schedule">
                    {invitation.schedule_items.map((item) => (
                        <li key={item.time}><time>{item.time}</time><div><h3>{item.title}</h3><p>{item.note}</p></div></li>
                    ))}
                </ol>
            </section>

            <section>
                <h2>Подтвердите приглашение</h2>
                <p className="note">Чтобы повара не гадали, а мы не считали гостей по тостам.</p>
                {sent ? (
                    <p className="thanks">Спасибо, {answers.name}! Мы вас записали. Ждём вас и ваше хорошее настроение.</p>
                ) : (
                    <form onSubmit={submit}>
                        <label className="field">Ваше имя<input value={answers.name} onChange={(event) => set('name', event.target.value)} required /></label>
                        <label className="field">Сколько вас будет<input type="number" min={1} max={5} value={answers.guests} onChange={(event) => set('guests', Number(event.target.value))} /></label>
                        <Choice legend="Едите рыбу?" name="fish" value={answers.fish} onChange={set} options={[["yes", "Да"], ["no", "Нет"]]} />
                        <Choice legend="А мясо?" name="meat" value={answers.meat} onChange={set} options={[["yes", "Конечно"], ["no", "Я вегетарианец"]]} />
                        <Choice legend="Алкоголь?" name="alcohol" value={answers.alcohol} onChange={set} options={[["yes", "Да"], ["little", "Чуть-чуть"], ["no", "Нет"]]} />
                        <label className="field">Аллергии и пожелания<textarea rows={3} placeholder="Например: орехи, лактоза, «хочу много торта»" value={answers.allergies} onChange={(event) => set('allergies', event.target.value)} /></label>
                        {submitError && <p role="alert">{submitError}</p>}
                        <button type="submit" disabled={submitting}>{submitting ? 'Отправляем…' : 'Подтвердить присутствие'}</button>
                    </form>
                )}
            </section>

            <footer>До встречи! {invitation.bride} и {invitation.groom}</footer>
        </main>
    )
}
