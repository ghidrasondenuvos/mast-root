from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional # ΝΕΟ: Επιτρέπει προαιρετικά πεδία
import models, database

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class UserRegistration(BaseModel):
    username: str = Field(..., min_length=2)
    email: EmailStr 
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=2)
    account_type: str = "volunteer" # volunteer, organization, sponsor
    skills: Optional[str] = ""      # Προαιρετικό πλέον
    resources: Optional[str] = ""   # Προαιρετικό πλέον

@app.post("/register")
def register_user(data: UserRegistration, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(
        (models.User.email == data.email) | (models.User.username == data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Το Email ή το Username χρησιμοποιείται ήδη.")

    try:
        new_user = models.User(username=data.username, email=data.email, password=data.password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        new_profile = models.Profile(user_id=new_user.user_id, full_name=data.full_name, account_type=data.account_type)
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)

        # ΠΛΕΟΝ ΑΠΟΘΗΚΕΥΕΤΑΙ ΓΙΑ ΟΛΟΥΣ (Εθελοντές, Οργανισμούς, Χορηγούς)
        new_extra = models.VolunteerProfile(profile_id=new_profile.profile_id, skills=data.skills, resources=data.resources)
        db.add(new_extra)
        db.commit()

        return {"message": "Επιτυχής δημιουργία λογαριασμού!"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")
    
@app.get("/api/db-view")
def view_database(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    result = []
    for u in users:
        profile = u.profile
        volunteer = profile.volunteer if profile else None
        result.append({
            "id": u.user_id,
            "username": u.username,
            "password": u.password,
            "email": u.email,
            "full_name": profile.full_name if profile else "-",
            "account_type": profile.account_type if profile else "-", # Στέλνουμε τον τύπο στο React
            "skills": volunteer.skills if volunteer else "-",
            "resources": volunteer.resources if volunteer else "-"
        })
    return result