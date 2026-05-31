# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Απαραίτητο για το React

app = FastAPI()

# Ρύθμιση CORS για να "μιλάει" το React με την Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/actions")
def get_actions():
    # Εδώ θα καλείτε τη βάση δεδομένων σας
    return {"message": "Λίστα περιβαλλοντικών δράσεων"}