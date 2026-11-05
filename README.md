# wedding-invitation

## Запуск

В одном терминале запустите API:

```powershell
go run ./cmd
```

Во втором — интерфейс разработки:

```powershell
cd web
npm install
npm run dev
```

Vite перенаправляет запросы `/api` на Go-сервер `http://127.0.0.1:8080`.

## Административные маршруты

Для изменения приглашения (`PATCH /api/invitation/{slug}`) и просмотра RSVP (`GET /api/rsvp/{slug}/rsvps`) нужен заголовок `Authorization: Bearer <ADMIN_TOKEN>`. Перед запуском API задайте `ADMIN_TOKEN`; если переменная не задана, эти маршруты отвечают `503 Service Unavailable`.

В PowerShell токен можно задать так:

```powershell
$env:ADMIN_TOKEN = "your-secret-token"
go run ./cmd
```

Для запуска одной production-версии сначала выполните `npm run build` в каталоге `web`, затем `go run ./cmd`. Go-сервер отдаст содержимое `web/dist` и API на `http://localhost:8080`.
