package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"wedding-invitation/internal/model"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func (s *Server) PostRSVP(w http.ResponseWriter, r *http.Request) {
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

	if _, ok := s.store.Get(body.Slug); !ok {
		http.Error(w, "invitation not found", http.StatusNotFound)
		return
	}

	s.store.SaveRSVP(body)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}

func (s *Server) ListRSVP(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	rsvps := s.store.ListRSVP(slug)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(rsvps); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}
