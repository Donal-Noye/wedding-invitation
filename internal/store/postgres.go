package store

import (
	"context"
	"errors"
	"wedding-invitation/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Postgres struct {
	pool *pgxpool.Pool
}

func NewPostgres(ctx context.Context, dsn string) (*Postgres, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	if err = pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return &Postgres{pool: pool}, nil
}

func (p *Postgres) Close() {
	p.pool.Close()
}

func (p *Postgres) GetInvitation(ctx context.Context, slug string) (*model.Invitation, error) {
	var inv model.Invitation
	err := p.pool.QueryRow(ctx,
		`SELECT data FROM invitations WHERE slug = $1`,
		slug,
	).Scan(&inv)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, model.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (p *Postgres) SaveInvitation(ctx context.Context, inv *model.Invitation) error {
	_, err := p.pool.Exec(ctx,
		`INSERT INTO invitations (slug, data)
		 VALUES ($1, $2)
		 ON CONFLICT (slug) DO UPDATE
		 SET data = EXCLUDED.data, updated_at = now()`,
		inv.Slug, inv,
	)
	return err
}

func (p *Postgres) SaveRSVP(ctx context.Context, r model.RSVP) error {
	_, err := p.pool.Exec(ctx,
		`INSERT INTO rsvps (slug, name, guests, attending, fish, meat, alcohol, allergies)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		r.Slug, r.Name, r.Guests, r.Attending, r.Fish, r.Meat, r.Alcohol, r.Allergies,
	)
	return err
}

func (p *Postgres) ListRSVP(ctx context.Context, slug string) ([]model.RSVP, error) {
	rows, err := p.pool.Query(ctx,
		`SELECT slug, name, guests, attending, fish, meat, alcohol, allergies
		 FROM rsvps WHERE slug = $1 ORDER BY created_at`,
		slug,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []model.RSVP{}
	for rows.Next() {
		var r model.RSVP
		if err = rows.Scan(&r.Slug, &r.Name, &r.Guests, &r.Attending,
			&r.Fish, &r.Meat, &r.Alcohol, &r.Allergies); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
