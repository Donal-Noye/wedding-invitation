package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"wedding-invitation/internal/model"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func (s *Server) PostRSVP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	r.Body = http.MaxBytesReader(w, r.Body, 1<<14)

	var body model.RSVP
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	body.Name = strings.TrimSpace(body.Name)

	if err := validate.Struct(&body); err != nil {
		http.Error(w, "invalid data: "+err.Error(), http.StatusBadRequest)
		return
	}

	if _, err := s.invitations.GetInvitation(ctx, body.Slug); err != nil {
		if errors.Is(err, model.ErrNotFound) {
			http.Error(w, "invitation not found", http.StatusNotFound)
			return
		}
		log.Println("get invitation:", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	if err := s.rsvps.SaveRSVP(ctx, body); err != nil {
		log.Println("save rsvp:", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}

func (s *Server) ListRSVP(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	rsvps, err := s.rsvps.ListRSVP(r.Context(), slug)
	if err != nil {
		log.Println("list rsvp:", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(rsvps); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}
