"""
Unit tests for auth_utils.py

These tests are self-contained — no MongoDB, Redis, or bcrypt backend required.
We mock passlib's CryptContext so tests run on any Python/bcrypt version.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
import jwt
from datetime import timedelta
from unittest.mock import patch, MagicMock


# ── Patch passlib before auth_utils imports it ────────────────────────────────
# bcrypt 4+ removed __about__, which causes passlib 1.7.4 to crash.
# We patch the CryptContext so tests are backend-agnostic.
FAKE_HASH = "$2b$12$fakehashedpassword1234567890abcdef"

mock_pwd_context = MagicMock()
mock_pwd_context.hash.return_value = FAKE_HASH
mock_pwd_context.verify.side_effect = lambda plain, hashed: (
    # Simulate correct verification only when plain matches the "registered" pw
    plain == "correct_password" and hashed == FAKE_HASH
)

with patch("passlib.context.CryptContext", return_value=mock_pwd_context):
    from auth_utils import (
        get_password_hash,
        verify_password,
        create_access_token,
        SECRET_KEY,
        ALGORITHM,
    )


class TestPasswordHashing:
    def test_hash_returns_string(self):
        hashed = get_password_hash("mysecretpassword")
        assert isinstance(hashed, str)

    def test_hash_is_not_plaintext(self):
        hashed = get_password_hash("mysecretpassword")
        assert hashed != "mysecretpassword"

    def test_hash_starts_with_bcrypt_prefix(self):
        hashed = get_password_hash("test")
        assert hashed.startswith("$2")

    def test_same_password_calls_hash(self):
        """Verify that get_password_hash delegates to the pwd_context."""
        with patch("auth_utils.pwd_context") as ctx:
            ctx.hash.return_value = FAKE_HASH
            result = get_password_hash("my_pass")
            ctx.hash.assert_called_once_with("my_pass")
            assert result == FAKE_HASH


class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        with patch("auth_utils.pwd_context") as ctx:
            ctx.verify.return_value = True
            assert verify_password("correct_password", FAKE_HASH) is True

    def test_wrong_password_returns_false(self):
        with patch("auth_utils.pwd_context") as ctx:
            ctx.verify.return_value = False
            assert verify_password("wrong_password", FAKE_HASH) is False

    def test_verify_delegates_to_pwd_context(self):
        with patch("auth_utils.pwd_context") as ctx:
            ctx.verify.return_value = True
            verify_password("pw", FAKE_HASH)
            ctx.verify.assert_called_once_with("pw", FAKE_HASH)


class TestCreateAccessToken:
    def test_returns_string(self):
        token = create_access_token({"sub": "testuser"})
        assert isinstance(token, str)

    def test_token_contains_sub_claim(self):
        token = create_access_token({"sub": "alice"})
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "alice"

    def test_token_contains_exp_claim(self):
        token = create_access_token({"sub": "alice"})
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in decoded

    def test_custom_expiry_is_respected(self):
        """Token with a 30-day expiry should decode without error."""
        token = create_access_token({"sub": "alice"}, expires_delta=timedelta(days=30))
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "alice"

    def test_additional_claims_are_preserved(self):
        token = create_access_token({"sub": "alice", "id": "abc123"})
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["id"] == "abc123"
