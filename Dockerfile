# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/next.config.ts frontend/dataSource.ts frontend/tsconfig.json frontend/eslint.config.mjs frontend/vitest.config.ts ./
COPY frontend/public ./public
COPY frontend/src ./src
ENV NEXT_PUBLIC_DATA_SOURCE=api
RUN npm run build

FROM ruby:3.4.2-slim-bookworm AS ruby-dependencies
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/Gemfile backend/Gemfile.lock ./
RUN bundle config set without "development test" && bundle install --jobs 4 --retry 3

FROM ruby:3.4.2-slim-bookworm AS production
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 curl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 10001 rails && useradd --system --uid 10001 --gid rails --create-home rails
WORKDIR /app
COPY --from=ruby-dependencies /usr/local/bundle /usr/local/bundle
COPY --chown=rails:rails backend ./
COPY --from=frontend --chown=rails:rails /app/out ./public
RUN mkdir -p tmp/pids log storage && chown -R rails:rails tmp log storage
ENV RAILS_ENV=production RAILS_LOG_TO_STDOUT=1 PORT=8080
USER rails
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD curl --fail http://localhost:8080/up || exit 1
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
