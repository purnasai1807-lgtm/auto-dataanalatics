from passlib.hash import bcrypt
from app.core.security import get_password_hash, verify_password
def test_password_hash_round_trip_supports_long_passwords():
    password = "LongPassword-" * 10
    hashed = get_password_hash(password)
    assert hashed.startswith("$bcrypt-sha256$")
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False
def test_password_verification_accepts_legacy_bcrypt_hashes():
    password = "LegacyPass123"
    legacy_hash = bcrypt.hash(password)
    assert verify_password(password, legacy_hash) is True