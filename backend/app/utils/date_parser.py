from datetime import datetime, date
from typing import Optional


def parse_financial_date(date_str: str) -> Optional[date]:
    """
    Parse a date string accepting only YYYY-MM-DD and DD-MM-YYYY formats.
    Returns datetime.date or None if invalid.
    """
    if not date_str or not isinstance(date_str, str):
        return None
    
    date_str = date_str.strip()
    
    # Try YYYY-MM-DD
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        pass
    
    # Try DD-MM-YYYY
    try:
        return datetime.strptime(date_str, "%d-%m-%Y").date()
    except ValueError:
        pass
    
    return None
