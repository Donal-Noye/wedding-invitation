export type Invitation = {
    slug: string
    bride: string
    groom: string
    wedding_date: string
    hero: { bride_photo: string; groom_photo: string; lead: string }
    invite_text: { title: string; text: string; photo: string }
    location: { title: string; venue: string; address: string; note: string; map_url: string }
    dress_code: { title: string, text: string, colors: { name: string, hex: string }[], do: string[], avoid: string[] }
    schedule_items: { time: string; title: string; note: string }[]
}

export type RSVP = {
    slug: string
    attending: boolean
    name: string
    guests: number
    fish: string
    meat: string
    alcohol: string
    allergies: string
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init)
    if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `API request failed (${response.status})`)
    }
    return response.json() as Promise<T>
}

export function getInvitation(slug: string): Promise<Invitation> {
    return request<Invitation>(`/api/invitation/${encodeURIComponent(slug)}`)
}

export function submitRSVP(rsvp: RSVP): Promise<RSVP> {
    return request<RSVP>('/api/rsvp', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(rsvp),
    })
}
