from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΚΛΕΙΔΙ ΓΙΑ ΤΗ ΣΥΝΔΕΣΗ
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Επιτρέπει αιτήματα από παντού (για local testing)
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/test-connection")
def test_connection():
    return {"message": "Η σύνδεση είναι ενεργή!"}