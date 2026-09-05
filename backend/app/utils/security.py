import os
import hmac
import hashlib
import base64
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ai-finance-controller-super-secret-jwt-key-2026-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using salted PBKDF2-HMAC-SHA256.
    Works natively on all platforms without external binary C-dependencies.
    """
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    salt_b64 = base64.b64encode(salt).decode("ascii")
    key_b64 = base64.b64encode(key).decode("ascii")
    return f"pbkdf2:sha256:100000${salt_b64}${key_b64}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored salted PBKDF2 hash."""
    try:
        if not hashed_password or "$" not in hashed_password:
            return False
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        params, salt_b64, key_b64 = parts
        salt = base64.b64decode(salt_b64.encode("ascii"))
        expected_key = base64.b64decode(key_b64.encode("ascii"))
        
        # Calculate key with same salt and iterations
        actual_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
        return hmac.compare_digest(actual_key, expected_key)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None
