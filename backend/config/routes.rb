Rails.application.routes.draw do
  get "/up", to: "health#show"

  get "/auth/:provider/callback", to: "auth/callbacks#create"
  get "/auth/failure", to: redirect("/?authError=failed", status: 302)
  post "/dev/login", to: "dev_sessions#create" if Rails.env.development?

  namespace :api do
    namespace :v1 do
      resource :session, only: %i[show destroy]
      resources :sauna_visits, only: %i[index create update destroy] do
        delete "history_entries/:history_id", to: "history_entries#destroy"
        collection { post :imports, to: "imports#create" }
      end
      get "images/:signed_id", to: "images#show", as: :image
    end
  end

  root "static#index"
  get "/stats", to: "static#stats"
  get "*path", to: "static#index", constraints: ->(request) {
    !request.path.start_with?("/api/", "/auth/", "/dev/")
  }
end
