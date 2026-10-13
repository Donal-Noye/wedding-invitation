package handler

import (
	"encoding/json"
	"net/http"
	"slices"
)

func (s *Server) GetInvitation(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	inv, ok := s.store.Get(slug)
	if !ok {
		http.Error(w, "invitation not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(inv); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}

func (s *Server) PatchInvitation(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	existing, ok := s.store.Get(slug)
	if !ok {
		http.Error(w, "invitation not found", http.StatusNotFound)
		return
	}

	inv := *existing
	inv.Schedule = slices.Clone(existing.Schedule)
	if err := json.NewDecoder(r.Body).Decode(&inv); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	inv.Slug = slug

	s.store.Save(&inv)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(inv); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}
