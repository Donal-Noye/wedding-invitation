create-migration:
	@migrate create -ext sql -dir migrations -seq ${name}

migrate-up:
	@make migrate-action action=up

migrate-down:
	@make migrate-action action=down

migrate-action:
	@migrate -path migrations -database postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}?sslmode=disable \
		$(action)