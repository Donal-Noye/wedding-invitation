import { useState, type FormEvent } from 'react'
import { submitRSVP } from '../api'

type Answers = {
  name: string
  guests: number
  fish: string
  meat: string
  alcohol: string
  allergies: string
}

const initialAnswers: Answers = {
  name: '',
  guests: 1,
  fish: '',
  meat: '',
  alcohol: '',
  allergies: '',
}

type AnswerKey = keyof Answers

function Choice({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string
  name: AnswerKey
  options: [string, string][]
  value: string
  onChange: (name: AnswerKey, value: string) => void
}) {
  return (
    <fieldset className="choice">
      <legend>{legend}</legend>
      <div className="choice-row">
        {options.map(([optionValue, label]) => (
          <label key={optionValue} className={value === optionValue ? 'pill on' : 'pill'}>
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(name, optionValue)}
              required
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function RSVPForm({ slug }: { slug: string }) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateAnswer(name: AnswerKey, value: string | number) {
    setAnswers((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await submitRSVP({ slug, attending: true, ...answers })
      setSent(true)
    } catch {
      setError('Не удалось отправить ответ. Проверьте соединение и попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return <p className="thanks">Спасибо, {answers.name}! Мы вас записали. Ждём вас и ваше хорошее настроение.</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="field">Ваше имя<input value={answers.name} onChange={(event) => updateAnswer('name', event.target.value)} required /></label>
      <label className="field">Сколько вас будет<input type="number" min={1} max={5} value={answers.guests} onChange={(event) => updateAnswer('guests', Number(event.target.value))} /></label>
      <Choice legend="Едите рыбу?" name="fish" value={answers.fish} onChange={updateAnswer} options={[["yes", "Да"], ["no", "Нет"]]} />
      <Choice legend="А мясо?" name="meat" value={answers.meat} onChange={updateAnswer} options={[["yes", "Конечно"], ["no", "Я вегетарианец"]]} />
      <Choice legend="Алкоголь?" name="alcohol" value={answers.alcohol} onChange={updateAnswer} options={[["yes", "Да"], ["little", "Чуть-чуть"], ["no", "Нет"]]} />
      <label className="field">Аллергии и пожелания<textarea rows={3} placeholder="Например: орехи, лактоза, хочу много торта" value={answers.allergies} onChange={(event) => updateAnswer('allergies', event.target.value)} /></label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>{submitting ? 'Отправляем…' : 'Подтвердить присутствие'}</button>
    </form>
  )
}
