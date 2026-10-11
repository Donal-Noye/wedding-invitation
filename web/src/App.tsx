import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

// Поменяйте под себя
const WEDDING_DATE = new Date('2027-06-12T15:00:00')
const BRIDE = 'Анна'
const GROOM = 'Иван'

const schedule = [
    { time: '14:30', title: 'Сбор гостей', joke: 'Приходите заранее, мы будем делать вид, что не нервничаем.' },
    { time: '15:00', title: 'Церемония', joke: 'Будем говорить «да» и стараться не плакать (получится не у всех).' },
    { time: '16:00', title: 'Фото и welcome', joke: 'Улыбаемся, пока не заболят щёки.' },
    { time: '17:00', title: 'Банкет', joke: 'Тосты — не длиннее трёх минут, мы засекаем.' },
    { time: '19:00', title: 'Первый танец', joke: 'Заранее извиняемся перед ногами.' },
    { time: '20:00', title: 'Танцы и торт', joke: 'Торт делим честно. Почти.' },
    { time: '23:00', title: 'Финал', joke: 'Кто устал — такси ждёт. Кто нет — мы тоже.' },
]

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
                        <input
                            type="radio"
                            name={props.name}
                            value={value}
                            checked={props.value === value}
                            onChange={() => props.onChange(props.name, value)}
                            required
                        />
                        {label}
                    </label>
                ))}
            </div>
        </fieldset>
    )
}

export default function App() {
    const left = useCountdown(WEDDING_DATE)
    const [answers, setAnswers] = useState<Answers>(initial)
    const [sent, setSent] = useState(false)

    const set = (name: keyof Answers, value: string | number) =>
        setAnswers((a) => ({ ...a, [name]: value }))

    const submit = (e: FormEvent) => {
        e.preventDefault()
        // Пока без бэкенда. Позже здесь будет fetch('/api/rsvp', { method: 'POST', ... })
        console.log('RSVP', answers)
        setSent(true)
    }

    const dateText = WEDDING_DATE.toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
    })

    return (
        <main>
            <section className="hero">
                <div className="photos">
                    <img src="https://placehold.co/400x520/B9707A/F2F5EF?text=Anna" alt={BRIDE} />
                    <img src="https://placehold.co/400x520/1E2F2A/F2F5EF?text=Ivan" alt={GROOM} />
                </div>
                <h1>{BRIDE} и {GROOM}</h1>
                <p className="date">{dateText}</p>
                <p className="lead">Мы женимся! Да, мы тоже удивлены.</p>
                <div className="timer" aria-label="Время до свадьбы">
                    {[
                        [left.days, 'дней'],
                        [left.hours, 'часов'],
                        [left.minutes, 'минут'],
                        [left.seconds, 'секунд'],
                    ].map(([n, label]) => (
                        <div key={label}>
                            <b>{String(n).padStart(2, '0')}</b>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2>Дорогие друзья и родные!</h2>
                <img className="wide" src="https://placehold.co/900x500/8FA68E/F2F5EF?text=Together" alt="Мы вдвоём" />
                <p>
                    В этот день мы хотим собрать вместе самых близких людей, чтобы разделить с вами
                    радость, танцы и очень много вкусной еды. Ваше присутствие — лучший подарок.
                    Подарки в конвертах тоже приветствуются, но это уже шутка (наполовину).
                </p>
            </section>

            <section>
                <h2>Где и когда</h2>
                <p className="big">Регистрация в 15:00</p>
                <p>Дворец бракосочетания «Название», ул. Примерная, 1</p>
                <p className="note">Парковка есть. Совесть — тоже, поэтому просим не опаздывать.</p>
                <a className="link" href="https://maps.google.com" target="_blank" rel="noreferrer">
                    Открыть на карте
                </a>
            </section>

            <section>
                <h2>Расписание дня</h2>
                <ol className="schedule">
                    {schedule.map((s) => (
                        <li key={s.time}>
                            <time>{s.time}</time>
                            <div>
                                <h3>{s.title}</h3>
                                <p>{s.joke}</p>
                            </div>
                        </li>
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
                        <label className="field">
                            Ваше имя
                            <input
                                value={answers.name}
                                onChange={(e) => set('name', e.target.value)}
                                required
                            />
                        </label>
                        <label className="field">
                            Сколько вас будет
                            <input
                                type="number" min={1} max={5}
                                value={answers.guests}
                                onChange={(e) => set('guests', Number(e.target.value))}
                            />
                        </label>

                        <Choice legend="Едите рыбу?" name="fish" value={answers.fish} onChange={set}
                                options={[['yes', 'Да'], ['no', 'Нет']]} />
                        <Choice legend="А мясо?" name="meat" value={answers.meat} onChange={set}
                                options={[['yes', 'Конечно'], ['no', 'Я вегетарианец']]} />
                        <Choice legend="Алкоголь?" name="alcohol" value={answers.alcohol} onChange={set}
                                options={[['yes', 'Да'], ['little', 'Чуть-чуть'], ['no', 'Нет']]} />

                        <label className="field">
                            Аллергии и пожелания
                            <textarea
                                rows={3}
                                placeholder="Например: орехи, лактоза, «хочу много торта»"
                                value={answers.allergies}
                                onChange={(e) => set('allergies', e.target.value)}
                            />
                        </label>

                        <button type="submit">Подтвердить присутствие</button>
                    </form>
                )}
            </section>

            <footer>До встречи! {BRIDE} и {GROOM}</footer>
        </main>
    )
}
