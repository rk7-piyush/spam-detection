import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SpamGuard API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # fine for a prototype; restrict when deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS = {
    "email": joblib.load("model/email_model.pkl"),
    "sms": joblib.load("model/sms_model.pkl"),
}


class Req(BaseModel):
    text: str
    type: str = "email"       # "email" or "sms"


def top_spam_words(model, text, n=6):
    tfidf = model.named_steps["tfidf"]
    clf = model.named_steps["clf"]
    x = tfidf.transform([text]).toarray()[0]
    contrib = x * clf.coef_[0]
    names = tfidf.get_feature_names_out()
    idx = np.argsort(contrib)[::-1][:n]
    return [names[i] for i in idx if contrib[i] > 0]


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/classify")
def classify(req: Req):
    model = MODELS.get(req.type.lower(), MODELS["email"])
    prob = float(model.predict_proba([req.text])[0][1])
    spam = prob >= 0.5

    if spam:
        words = top_spam_words(model, req.text)
        reasons = [f'Suspicious word: "{w}"' for w in words] or ["Overall wording matches known spam"]
    else:
        reasons = ["No suspicious patterns found"]

    return {
        "label": "spam" if spam else "ham",
        "confidence": prob if spam else 1 - prob,   # the UI shows confidence in the chosen label
        "reasons": reasons,
    }