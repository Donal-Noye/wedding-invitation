package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"slices"
	"wedding-invitation/internal/model"
)

func (s *Server) GetInvitation(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	inv, err := s.invitations.GetInvitation(r.Context(), slug)
	if errors.Is(err, model.ErrNotFound) {
		http.Error(w, "invitation not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Println("get invitation:", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(inv); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}

func (s *Server) PatchInvitation(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	existing, err := s.invitations.GetInvitation(r.Context(), slug)
	if errors.Is(err, model.ErrNotFound) {
		http.Error(w, "invitation not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Println("get invitation:", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	inv := *existing
	inv.Schedule = slices.Clone(existing.Schedule)
	if err := json.NewDecoder(r.Body).Decode(&inv); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	inv.Slug = slug

	if err := s.invitations.SaveInvitation(r.Context(), &inv); err != nil {
		log.Println("save invitation:", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(inv); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}
