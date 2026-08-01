class User < ApplicationRecord
  has_many :sauna_visits, dependent: :destroy

  validates :google_subject, :email, presence: true
  validates :google_subject, uniqueness: true
  validates :email, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }

  before_validation { self.email = email.to_s.downcase }
end
