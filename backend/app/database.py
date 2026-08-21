from typing import Optional
import logging
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def get_supabase() -> Optional[Client]:
    """
    Get or initialize the Supabase client.
    Returns None if credentials are placeholders during local scaffolding.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    
    if (
        settings.SUPABASE_URL
        and settings.SUPABASE_KEY
        and not settings.SUPABASE_URL.startswith("https://placeholder")
        and settings.SUPABASE_KEY != "placeholder-key"
    ):
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase client: {e}")
            _supabase_client = None
    else:
        logger.info("Supabase credentials not configured or placeholder detected.")
    
    return _supabase_client
