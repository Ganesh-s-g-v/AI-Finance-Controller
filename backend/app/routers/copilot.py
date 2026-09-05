from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
from app.config import settings

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

client = genai.Client(api_key=settings.GEMINI_API_KEY)


class CopilotRequest(BaseModel):
    question: str
    transaction: dict


@router.post("")
async def ask_copilot(req: CopilotRequest):
    t = req.transaction

    prompt = f"""
You are a Chartered Accountant AI assisting an auditor.

Invoice ID: {t.get("invoiceId")}
Order ID: {t.get("orderId")}
Customer: {t.get("customerName")}
Invoice Amount: ₹{t.get("invoiceGross")}
Settlement Net: ₹{t.get("settlementNet")}
Bank Credit: ₹{t.get("bankCredit")}
Fee: ₹{t.get("fee")}
GST on Fee: ₹{t.get("tax")}
Confidence: {t.get("confidenceScore")}%
Status: {t.get("status")}

Existing reconciliation:
{t.get("aiExplanation")}

Auditor question:
{req.question}

Answer in under 180 words with financial reasoning.
"""

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )

        answer = response.text or "I couldn't generate a response."

        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))