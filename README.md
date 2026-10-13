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

Для запуска одной production-версии сначала выполните `npm run build` в каталоге `web`, затем `go run ./cmd`. Go-сервер отдаст содержимое `web/dist` и API на `http://localhost:8080`.
