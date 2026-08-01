class HealthController < ActionController::Base
  def show
    ActiveRecord::Base.connection.select_value("SELECT 1")
    render plain: "ok"
  rescue ActiveRecord::ActiveRecordError
    render plain: "database unavailable", status: :service_unavailable
  end
end
