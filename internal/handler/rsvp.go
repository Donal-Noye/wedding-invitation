package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"wedding-invitation/internal/model"
)

func (s *Server) PostRSVP(w http.ResponseWriter, r *http.Request) {
	var body model.RSVP
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(body.Name) == "" || body.Guests < 1 || body.Slug == "" {
		http.Error(w, "name, slug and at least one guest are required", http.StatusBadRequest)
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
