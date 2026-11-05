package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	"wedding-invitation/internal/handler"
	"wedding-invitation/internal/middleware"
	"wedding-invitation/internal/model"
	"wedding-invitation/internal/store"

	"github.com/joho/godotenv"
)

func main() {
	if err := run(); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}

func run() error {
	_ = godotenv.Load()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return errors.New("DATABASE_URL is not set")
	}

	pg, err := store.NewPostgres(ctx, dsn)
	if err != nil {
		return err
	}
	defer pg.Close()

	if _, err = pg.GetInvitation(ctx, "anna-ivan"); errors.Is(err, model.ErrNotFound) {
		if err = pg.SaveInvitation(ctx, &model.Invitation{
			Slug:        "anna-ivan",
			Bride:       "Анна",
			Groom:       "Иван",
			WeddingDate: "2027-06-12T15:00:00+03:00",
			Hero: model.Hero{
				BridePhoto: "https://placehold.co/400x520/B9707A/F2F5EF?text=Anna",
				GroomPhoto: "https://placehold.co/400x520/1E2F2A/F2F5EF?text=Ivan",
				Lead:       "Мы женимся! Да, мы тоже удивлены.",
			},
			Invitation: model.InviteText{
				Title: "Дорогие друзья и родные!",
				Text:  "В этот день мы хотим собрать вместе самых близких людей...",
				Photo: "https://placehold.co/900x500/8FA68E/F2F5EF?text=Together",
			},
			Location: model.Location{
				Title:   "Регистрация в 15:00",
				Venue:   "Дворец бракосочетания «Название»",
				Address: "ул. Примерная, 1",
				Note:    "Парковка есть. Совесть — тоже, поэтому просим не опаздывать.",
				MapURL:  "https://maps.google.com",
			},
			DressCode: model.DressCode{
				Title: "Дресс-код",
				Text:  "Тёплые оттенки и хорошее настроение. Остальное мы переживём.",
				Colors: []model.Swatch{
					{Name: "шоколад", Hex: "#3a2417"},
					{Name: "медь", Hex: "#8a5a3b"},
					{Name: "шампань", Hex: "#d9b382"},
					{Name: "слоновая кость", Hex: "#f3e7d7"},
				},
				Do:    []string{"Лён и шёлк", "Удобная обувь", "Хорошее настроение"},
				Avoid: []string{"Белое (оно за невестой)", "Каблуки на траве", "Неоновые цвета"},
			},
			Schedule: []model.ScheduleItem{
				{Time: "14:30", Title: "Сбор гостей", Note: "Приходите заранее: мы будем делать вид, что совсем не нервничаем."},
				{Time: "15:00", Title: "Церемония", Note: "Скажем «да» и постараемся не плакать. Получится не у всех, так что берите платочки."},
				{Time: "17:00", Title: "Банкет", Note: "Тосты не длиннее трёх минут, а салаты не обсуждаются: они просто исчезают."},
				{Time: "20:00", Title: "Танцы и торт", Note: "Сначала первый танец, потом торт. Если перепутаем порядок, мы не обидимся."},
				{Time: "23:00", Title: "Финал", Note: "Кто устал, того ждёт такси. Кто нет, того ждём мы."},
			},
		}); err != nil {
			return fmt.Errorf("seed invitation: %w", err)
		}
	} else if err != nil {
		return fmt.Errorf("check invitation: %w", err)
	}

	srv := handler.New(pg, pg, os.Getenv("ADMIN_TOKEN"))
	h := middleware.Chain(srv.Routes(), middleware.Recover, middleware.Logger, middleware.RequestID)

	httpSrv := &http.Server{
		Addr:              ":8080",
		Handler:           h,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		slog.Info("server started", "addr", httpSrv.Addr)
		if err := httpSrv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
		close(errCh)
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		slog.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpSrv.Shutdown(shutdownCtx); err != nil {
		if closeErr := httpSrv.Close(); closeErr != nil {
			return errors.Join(err, closeErr)
		}
		return err
	}
	slog.Info("server stopped gracefully")
	return nil
}
