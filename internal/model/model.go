package model

type ScheduleItem struct {
	Time  string `json:"time"`
	Title string `json:"title"`
	Note  string `json:"note"`
}

type Invitation struct {
	Slug        string         `json:"slug"`
	Bride       string         `json:"bride"`
	Groom       string         `json:"groom"`
	WeddingDate string         `json:"wedding_date"`
	Hero        Hero           `json:"hero"`
	Invitation  InviteText     `json:"invite_text"`
	Location    Location       `json:"location"`
	Schedule    []ScheduleItem `json:"schedule_items"`
}

type Hero struct {
	BridePhoto string `json:"bride_photo"`
	GroomPhoto string `json:"groom_photo"`
	Lead       string `json:"lead"`
}

type InviteText struct {
	Title string `json:"title"`
	Text  string `json:"text"`
	Photo string `json:"photo"`
}

type Location struct {
	Title   string `json:"title"`
	Venue   string `json:"venue"`
	Address string `json:"address"`
	Note    string `json:"note"`
	MapURL  string `json:"map_url"`
}

type RSVP struct {
	Slug      string `json:"slug"      validate:"required,max=64"`
	Guests    int    `json:"guests"    validate:"required,gte=1,lte=10"`
	Name      string `json:"name"      validate:"required,max=100"`
	Attending bool   `json:"attending"`
	Fish      string `json:"fish"      validate:"omitempty,oneof=yes no"`
	Meat      string `json:"meat"      validate:"omitempty,oneof=yes no"`
	Alcohol   string `json:"alcohol"   validate:"omitempty,oneof=yes little no"`
	Allergies string `json:"allergies" validate:"max=500"`
}
