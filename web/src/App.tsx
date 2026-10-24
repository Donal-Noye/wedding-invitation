import { useEffect, useState } from 'react'
import { getInvitation, type Invitation } from './api'
import { ParticleBackground } from './components/ParticleBackground'
import { RSVPForm } from './components/RSVPForm'
import { useCountdown } from './hooks/useCountdown'
import './App.css'

const INVITATION_SLUG = 'anna-ivan'

function InvitationPage({ invitation }: { invitation: Invitation }) {
  const countdown = useCountdown(new Date(invitation.wedding_date))
  const date = new Date(invitation.wedding_date)
  const dateText = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const timeUnits = [
    [countdown.days, 'дней'],
    [countdown.hours, 'часов'],
    [countdown.minutes, 'минут'],
    [countdown.seconds, 'секунд'],
  ] as const

  return (
    <main>
      <ParticleBackground />

      <section className="hero">
        <div className="photos">
          <img src={invitation.hero.bride_photo} alt={invitation.bride} />
          <img src={invitation.hero.groom_photo} alt={invitation.groom} />
        </div>
        <h1>{invitation.bride} и {invitation.groom}</h1>
        <p className="date">{dateText}</p>
        <p className="lead">{invitation.hero.lead}</p>
        <div className="timer" aria-label="Время до свадьбы">
          {timeUnits.map(([value, label]) => (
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
            <li key={item.time}>
              <time>{item.time}</time>
              <div><h3>{item.title}</h3><p>{item.note}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Подтвердите приглашение</h2>
        <p className="note">Чтобы повара не гадали, а мы не считали гостей по тостам.</p>
        <RSVPForm slug={invitation.slug} />
      </section>

      <footer>До встречи! {invitation.bride} и {invitation.groom}</footer>
    </main>
  )
}

export default function App() {
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    getInvitation(INVITATION_SLUG)
      .then(setInvitation)
      .catch(() => setLoadError('Не удалось загрузить приглашение. Попробуйте обновить страницу.'))
  }, [])

  if (loadError) return <main><p role="alert">{loadError}</p></main>
  if (!invitation) return <main><p>Загружаем приглашение…</p></main>

  return <InvitationPage invitation={invitation} />
}
