module Api
  module V1
    class SessionsController < ApplicationController
      def show
        render json: {
          authenticated: current_user.present?,
          user: current_user && { email: current_user.email },
          csrfToken: form_authenticity_token
        }
      end

      def destroy
        reset_session
        head :no_content
      end
    end
  end
end
