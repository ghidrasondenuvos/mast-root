from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import models, database

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- PYDANTIC SCHEMAS ---
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

class UserUpdate(BaseModel):
    user_id: int
    username: str = Field(..., min_length=2)
    email: EmailStr 
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=2)
    account_type: str
    skills: Optional[str] = ""
    resources: Optional[str] = ""

class ActionCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str
    max_participants: int = Field(..., gte=1)
    location_name: str
    action_type_name: str
    creator_user_id: int

# --- ENDPOINTS ΧΡΗΣΤΩΝ ---
@app.post("/register")
def register_user(data: UserRegistration, db: Session = Depends(database.get_db)):
    try:
        new_user = models.User(username=data.username, email=data.email, password=data.password)
        db.add(new_user)
        db.flush() 

        new_profile = models.Profile(user_id=new_user.user_id, full_name=data.full_name, account_type=data.account_type)
        db.add(new_profile)
        db.flush()

        new_volunteer = models.VolunteerProfile(profile_id=new_profile.profile_id, skills=data.skills, resources=data.resources)
        db.add(new_volunteer)
        
        db.commit()
        return {"message": "Επιτυχής εγγραφή!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Σφάλμα κατά την εγγραφή. Το email ή username ίσως υπάρχει ήδη.")

@app.post("/login")
def login_user(data: UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or user.password != data.password:
        raise HTTPException(status_code=401, detail="Λάθος email ή κωδικός.")
    
    profile = user.profile
    return {
        "message": "Επιτυχής σύνδεση",
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

@app.put("/update-profile")
def update_profile(data: UserUpdate, db: Session = Depends(database.get_db)):
    try:
        user = db.query(models.User).filter(models.User.user_id == data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.username = data.username
        user.email = data.email
        user.password = data.password
        
        profile = user.profile
        if profile:
            profile.full_name = data.full_name
            profile.account_type = data.account_type
            if profile.volunteer:
                profile.volunteer.skills = data.skills
                profile.volunteer.resources = data.resources

        db.commit()
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

# --- ENDPOINTS ΔΡΑΣΕΩΝ & ΒΑΣΗΣ ---
@app.post("/actions")
def create_environmental_action(data: ActionCreate, db: Session = Depends(database.get_db)):
    try:
        location = db.query(models.Location).filter(models.Location.name.ilike(data.location_name)).first()
        if not location:
            location = models.Location(name=data.location_name)
            db.add(location)
            db.flush()

        action_type = db.query(models.ActionType).filter(models.ActionType.name.ilike(data.action_type_name)).first()
        if not action_type:
            action_type = models.ActionType(name=data.action_type_name)
            db.add(action_type)
            db.flush()

        org = db.query(models.Organisation).filter(models.Organisation.user_id == data.creator_user_id).first()
        if not org:
            user_profile = db.query(models.Profile).filter(models.Profile.user_id == data.creator_user_id).first()
            org_name = user_profile.full_name if user_profile else f"Οργανισμός User {data.creator_user_id}"
            org = models.Organisation(user_id=data.creator_user_id, name=org_name)
            db.add(org)
            db.flush()

        new_action = models.EnvironmentalAction(
            title=data.title,
            description=data.description,
            max_participants=data.max_participants,
            location_id=location.id,
            action_type_id=action_type.id,
            organisation_id=org.id
        )
        
        db.add(new_action)
        db.commit()
        return {"status": "success", "message": f"Η δράση '{data.title}' καταχωρήθηκε επιτυχώς!"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Σφάλμα Συστήματος: {str(e)}")

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

@app.get("/api/db-actions")
def view_actions(db: Session = Depends(database.get_db)):
    actions = db.query(models.EnvironmentalAction).all()
    result = []
    for a in actions:
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "max_participants": a.max_participants,
            "location": a.location.name if a.location else "-",
            "action_type": a.action_type.name if a.action_type else "-",
            "organisation": a.organisation.name if a.organisation else "-"
        })
    return result

# --- ΝΕΟ ENDPOINT: USE CASE 5 (ΑΝΑΖΗΤΗΣΗ) ---
@app.get("/api/search-actions")
def search_environmental_actions(
    location: Optional[str] = None,
    action_type: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.EnvironmentalAction)
    
    # 1. Φόρμα Κριτηρίων: Συλλέγουμε μόνο τα έγκυρα κριτήρια
    valid_criteria = {}
    if location and location.strip():
        valid_criteria['location'] = location.strip()
    if action_type and action_type.strip():
        valid_criteria['action_type'] = action_type.strip()
    if keyword and keyword.strip():
        valid_criteria['keyword'] = keyword.strip()
        
    # 2. Λούπα Ελέγχου Κριτηρίων (Ανάκτηση & Φιλτράρισμα)
    for key, value in valid_criteria.items():
        if key == 'location':
            query = query.filter(models.EnvironmentalAction.location.has(models.Location.name.ilike(f"%{value}%")))
        elif key == 'action_type':
            query = query.filter(models.EnvironmentalAction.action_type.has(models.ActionType.name.ilike(f"%{value}%")))
        elif key == 'keyword':
            query = query.filter(models.EnvironmentalAction.title.ilike(f"%{value}%"))

    # Εκτέλεση του query
    actions = query.all()
    
    # 3. Μήνυμα Σφάλματος αν δεν βρεθούν αποτελέσματα
    if not actions:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκαν δράσεις που να ταιριάζουν στα κριτήριά σας. Δοκιμάστε κάτι άλλο!")
        
    # 4. Οθόνη Αποτελεσμάτων Αναζήτησης
    result = []
    for a in actions:
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "max_participants": a.max_participants,
            "location": a.location.name if a.location else "-",
            "action_type": a.action_type.name if a.action_type else "-",
            "organisation": a.organisation.name if a.organisation else "-"
        })
    return result