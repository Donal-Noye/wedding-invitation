package model

import "errors"

var ErrNotFound = errors.New("not found")

type ScheduleItem struct {
	Time  string `json:"time"`
	Title string `json:"title"`
	Note  string `json:"note"`
	Place string `json:"place,omitempty"`
}

type Invitation struct {
	Slug        string         `json:"slug"`
	Bride       string         `json:"bride"`
	Groom       string         `json:"groom"`
	WeddingDate string         `json:"wedding_date"`
	Hero        Hero           `json:"hero"`
	Invitation  InviteText     `json:"invite_text"`
	Location    Location       `json:"location"`
	DressCode   DressCode      `json:"dress_code"`
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

type Swatch struct {
	Name string `json:"name"`
	Hex  string `json:"hex"`
}

type DressCode struct {
	Title  string   `json:"title"`
	Text   string   `json:"text"`
	Colors []Swatch `json:"colors"`
	Do     []string `json:"do"`
	Avoid  []string `json:"avoid"`
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
