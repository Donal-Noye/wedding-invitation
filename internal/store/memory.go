package store

import (
	"sync"
	"wedding-invitation/internal/model"
)

type Memory struct {
	mu          sync.RWMutex
	invitations map[string]*model.Invitation
	rsvps       []model.RSVP
}

func NewMemory() *Memory {
	return &Memory{
		invitations: make(map[string]*model.Invitation),
	}
}

func (s *Memory) Get(slug string) (*model.Invitation, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	inv, ok := s.invitations[slug]
	return inv, ok
}

func (s *Memory) Save(inv *model.Invitation) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.invitations[inv.Slug] = inv
}

func (s *Memory) SaveRSVP(rsvp model.RSVP) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.rsvps = append(s.rsvps, rsvp)
}
