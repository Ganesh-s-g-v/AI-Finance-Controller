import re
from typing import Optional


ORDER_ID_REGEX = re.compile(r"(ORD-[A-Za-z0-9_-]+|ORDER[_-]?[A-Za-z0-9_-]+)", re.IGNORECASE)


def extract_order_id(reference: Optional[str], description: Optional[str]) -> Optional[str]:
    """
    Extract order_id according to locked rule:
    1. First try to extract from reference field (look for 'ORD-' pattern)
    2. If not found, try to extract from description field
    3. If not found, return None
    """
    if reference:
        ref_clean = reference.strip()
        # Direct check if reference itself is an order ID format or contains it
        match = ORDER_ID_REGEX.search(ref_clean)
        if match:
            return match.group(0).upper()
        if ref_clean.startswith("ORD-") or ref_clean.startswith("ord-"):
            return ref_clean.upper()

    if description:
        desc_clean = description.strip()
        match = ORDER_ID_REGEX.search(desc_clean)
        if match:
            return match.group(0).upper()

    return None
