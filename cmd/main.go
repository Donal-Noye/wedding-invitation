package main

import (
	"log"
	"net/http"
	"wedding-invitation/internal/handler"
	"wedding-invitation/internal/model"
	"wedding-invitation/internal/store"
)

func main() {
	st := store.NewMemory()
	st.Save(&model.Invitation{
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
		Schedule: []model.ScheduleItem{
			{Time: "14:30", Title: "Сбор гостей", Note: "Приходите заранее, мы будем делать вид, что не нервничаем."},
			{Time: "15:00", Title: "Церемония", Note: "Будем говорить «да» и стараться не плакать."},
		},
	})
	api := handler.New(st).Routes()
	mux := http.NewServeMux()
	mux.Handle("/api/", api)
	mux.Handle("/", http.FileServer(http.Dir("web/dist")))

	log.Println("server started at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
