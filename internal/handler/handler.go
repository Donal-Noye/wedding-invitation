package handler

import (
	"net/http"
	"wedding-invitation/internal/model"
)

type InvitationStore interface {
	Get(slug string) (*model.Invitation, bool)
	Save(inv *model.Invitation)
	SaveRSVP(rsvp model.RSVP)
}

type Server struct {
	store InvitationStore
}

func New(store InvitationStore) *Server {
	return &Server{store: store}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/invitation/{slug}", s.GetInvitation)
	mux.HandleFunc("PATCH /api/invitation/{slug}", s.PatchInvitation)
	mux.HandleFunc("POST /api/rsvp", s.PostRSVP)
	return mux
}
