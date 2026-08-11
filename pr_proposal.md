## Title: 🧪 [Testing] Add comprehensive tests for User model

### Description
**🎯 What:**
This PR addresses the missing test coverage for the `User` model (`backend/app/models/user.rb`). Previously, there were no tests validating the critical logic inside the User model, leaving validations for attributes like `google_subject` and `email` unchecked.

**📊 Coverage:**
The newly added test file (`backend/test/models/user_test.rb`) uses `ActiveSupport::TestCase` to verify all aspects of the model:
*   **Presence Validation:** Ensures `google_subject` and `email` are required.
*   **Uniqueness Validation:** Verifies that both `google_subject` and `email` (case-insensitive) are strictly unique.
*   **Format Validation:** Checks valid and invalid email strings against `URI::MailTo::EMAIL_REGEXP` to guarantee valid structure.
*   **Callbacks:** Confirms the `before_validation` callback correctly converts the `email` to downcase.
*   **Associations:** Verifies the `dependent: :destroy` behavior, ensuring that when a User is deleted, their associated `sauna_visits` are also successfully destroyed.

**✨ Result:**
The test coverage for the `User` model is now thorough, ensuring any future refactoring can be done confidently without risking regressions in user identity or validation logic. The full test suite runs successfully with these new additions.
