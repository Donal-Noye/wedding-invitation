import {useEffect, useState} from 'react'
import {getInvitation, type Invitation} from './api'
import {RSVPFormSection} from './components/RSVPFormSection/RSVPFormSection.tsx'
import {useCountdown} from './hooks/useCountdown'
import './App.css'
import {Hero} from "./components/Hero/Hero.tsx";
import {StorySection} from "./components/InviteSection/StorySection.tsx";
import {useSectionScroll} from "./hooks/useSectionScroll.tsx";
import {RoadmapSection} from "./components/RoadmapSection/RoadmapSection.tsx";
import {DresscodeSection} from "./components/DresscodeSection/DresscodeSection.tsx";

const INVITATION_SLUG = 'anna-ivan'

function InvitationPage({invitation}: { invitation: Invitation }) {
    useSectionScroll()

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

    const slides = [
        {
            photo: 'https://placehold.co/600x800/3a2417/f3e7d7?text=1',
            title: 'Мы встретились',
            text: 'Это было случайно. Но мы теперь делаем вид, что всё было задумано.'
        },
        {
            photo: 'https://placehold.co/600x800/4a2e1d/f3e7d7?text=2',
            title: 'Мы поняли',
            text: 'Что вместе интереснее. И вкуснее.'
        },
        {
            photo: 'https://placehold.co/600x800/2c1b11/f3e7d7?text=3',
            title: 'Мы решили',
            text: 'И теперь зовём вас разделить этот день.'
        },
    ]

    return (
        <main>
            <Hero invitation={invitation} dateText={dateText} timeUnits={timeUnits}/>

            <StorySection slides={slides}/>

            <RoadmapSection items={invitation.schedule_items} title="Дорожная карта"/>

            {invitation.dress_code && <DresscodeSection data={invitation.dress_code}/>}

            <RSVPFormSection slug={invitation.slug}/>
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

    return <InvitationPage invitation={invitation}/>
}
