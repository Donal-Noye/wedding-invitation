package handler

import (
	"context"
	"crypto/subtle"
	"net/http"
	"strings"
	"wedding-invitation/internal/model"
)

type InvitationStore interface {
	GetInvitation(ctx context.Context, slug string) (*model.Invitation, error)
	SaveInvitation(ctx context.Context, inv *model.Invitation) error
}

type RSVPStore interface {
	SaveRSVP(ctx context.Context, rsvp model.RSVP) error
	ListRSVP(ctx context.Context, slug string) ([]model.RSVP, error)
}

type Server struct {
	invitations InvitationStore
	rsvps       RSVPStore
	adminToken  string
}

func New(inv InvitationStore, rsvps RSVPStore, adminToken string) *Server {
	return &Server{invitations: inv, rsvps: rsvps, adminToken: adminToken}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/invitation/{slug}", s.GetInvitation)
	mux.Handle("PATCH /api/invitation/{slug}", s.requireAdmin(http.HandlerFunc(s.PatchInvitation)))
	mux.HandleFunc("POST /api/rsvp", s.PostRSVP)
	mux.Handle("GET /api/rsvp/{slug}/rsvps", s.requireAdmin(http.HandlerFunc(s.ListRSVP)))
	return mux
}

func (s *Server) requireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.adminToken == "" {
			http.Error(w, "admin access is not configured", http.StatusServiceUnavailable)
			return
		}

		token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		if !ok || len(token) != len(s.adminToken) || subtle.ConstantTimeCompare([]byte(token), []byte(s.adminToken)) != 1 {
			w.Header().Set("WWW-Authenticate", "Bearer")
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
