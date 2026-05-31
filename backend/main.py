from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import models, database

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class UserRegistration(BaseModel):
    username: str = Field(..., min_length=2)
    email: EmailStr 
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=2)
    account_type: str = "volunteer"
    skills: Optional[str] = ""
    resources: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ΝΕΟ SCHEMA ΓΙΑ ΤΟ UPDATE
class UserUpdate(BaseModel):
    user_id: int
    username: str = Field(..., min_length=2)
    email: EmailStr 
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=2)
    account_type: str
    skills: Optional[str] = ""
    resources: Optional[str] = ""

@app.post("/register")
def register_user(data: UserRegistration, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(
        (models.User.email == data.email) | (models.User.username == data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="το email ή το username χρησιμοποιείται ήδη.")

    try:
        new_user = models.User(username=data.username, email=data.email, password=data.password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        new_profile = models.Profile(user_id=new_user.user_id, full_name=data.full_name, account_type=data.account_type)
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)

        new_extra = models.VolunteerProfile(profile_id=new_profile.profile_id, skills=data.skills, resources=data.resources)
        db.add(new_extra)
        db.commit()

        return {"message": "επιτυχής δημιουργία λογαριασμού!"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

@app.post("/login")
def login_user(data: UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    
    if not user or user.password != data.password:
        raise HTTPException(status_code=401, detail="λάθος email ή κωδικός πρόσβασης.")
    
    profile = user.profile
    volunteer = profile.volunteer if profile else None
    
    notifications = [
        {"id": 1, "text": f"καλώς ήρθες ξανά, {user.username}!"},
        {"id": 2, "text": "νέες περιβαλλοντικές δράσεις στην περιοχή σου."},
        {"id": 3, "text": "η οργάνωση 'GreenEarth' αναζητά εθελοντές."}
    ]

    # Επιστρέφουμε ΟΛΑ τα στοιχεία για να τα βάλουμε στη φόρμα Edit
    return {
        "message": "επιτυχής σύνδεση",
        "user": {
            "id": user.user_id,
            "username": user.username,
            "email": user.email,
            "password": user.password,
            "full_name": profile.full_name if profile else "",
            "account_type": profile.account_type if profile else "volunteer",
            "skills": volunteer.skills if volunteer else "",
            "resources": volunteer.resources if volunteer else ""
        },
        "notifications": notifications
    }

# ΝΕΟ ENDPOINT: ΤΡΟΠΟΠΟΙΗΣΗ ΠΡΟΦΙΛ
@app.put("/update-profile")
def update_user_profile(data: UserUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.user_id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="ο χρήστης δεν βρέθηκε.")

    # Ελέγχουμε αν το νέο email ή username ανήκει σε ΚΑΠΟΙΟΝ ΑΛΛΟ
    duplicate = db.query(models.User).filter(
        ((models.User.email == data.email) | (models.User.username == data.username)),
        models.User.user_id != data.user_id
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="το email ή το username χρησιμοποιείται ήδη από άλλον χρήστη.")

    try:
        # Ενημέρωση Στοιχείων
        user.username = data.username
        user.email = data.email
        user.password = data.password

        profile = user.profile
        if profile:
            profile.full_name = data.full_name
            profile.account_type = data.account_type
        
        if profile and profile.volunteer:
            profile.volunteer.skills = data.skills
            profile.volunteer.resources = data.resources

        db.commit()
        
        # Επιστρέφουμε τα νέα στοιχεία
        return {
            "message": "επιτυχής τροποποίηση",
            "user": {
                "id": user.user_id,
                "username": user.username,
                "email": user.email,
                "password": user.password,
                "full_name": profile.full_name if profile else "",
                "account_type": profile.account_type if profile else "volunteer",
                "skills": profile.volunteer.skills if profile and profile.volunteer else "",
                "resources": profile.volunteer.resources if profile and profile.volunteer else ""
            }
        }
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
            "account_type": profile.account_type if profile else "-",
            "skills": volunteer.skills if volunteer else "-",
            "resources": volunteer.resources if volunteer else "-"
        })
    return result