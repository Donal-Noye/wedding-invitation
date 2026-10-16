package handler

import (
	"net/http"
	"wedding-invitation/internal/model"
)

type InvitationStore interface {
	Get(slug string) (*model.Invitation, bool)
	Save(inv *model.Invitation)
}

type RSVPStore interface {
	SaveRSVP(rsvp model.RSVP)
	ListRSVP(slug string) []model.RSVP
}

type Store interface {
	InvitationStore
	RSVPStore
}

type Server struct {
	store Store
}

func New(store Store) *Server {
	return &Server{store: store}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/invitation/{slug}", s.GetInvitation)
	mux.HandleFunc("PATCH /api/invitation/{slug}", s.PatchInvitation)
	mux.HandleFunc("POST /api/rsvp", s.PostRSVP)
	mux.HandleFunc("GET /api/rsvp/{slug}/rsvps", s.ListRSVP)
	return mux
}
