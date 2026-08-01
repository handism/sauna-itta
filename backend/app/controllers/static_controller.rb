class StaticController < ActionController::Base
  def index
    file = Rails.root.join("public/index.html")
    file.file? ? send_file(file, type: "text/html", disposition: "inline") : head(:not_found)
  end

  def stats
    file = Rails.root.join("public/stats.html")
    file.file? ? send_file(file, type: "text/html", disposition: "inline") : head(:not_found)
  end
end
