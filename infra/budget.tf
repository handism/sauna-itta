resource "google_billing_budget" "monthly" {
  billing_account = var.billing_account
  display_name    = "${var.service_name} 月次予算"
  amount {
    specified_amount {
      currency_code = "JPY"
      units         = tostring(var.budget_jpy)
    }
  }
  threshold_rules { threshold_percent = 0.5 }
  threshold_rules { threshold_percent = 0.9 }
  threshold_rules { threshold_percent = 1.0 }
}
