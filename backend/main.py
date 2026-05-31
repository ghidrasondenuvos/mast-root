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

class ParticipateRequest(BaseModel):
    user_id: int

class DecisionSubmit(BaseModel):
    org_user_id: int
    status: str  # 'approved' ή 'rejected'

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


# --- ENDPOINTS ΔΡΑΣΕΩΝ, ΑΝΑΖΗΤΗΣΗΣ & ΣΥΜΜΕΤΟΧΗΣ ---
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


@app.get("/api/search-actions")
def search_environmental_actions(location: Optional[str] = None, action_type: Optional[str] = None, keyword: Optional[str] = None, db: Session = Depends(database.get_db)):
    query = db.query(models.EnvironmentalAction)
    
    valid_criteria = {}
    if location and location.strip(): valid_criteria['location'] = location.strip()
    if action_type and action_type.strip(): valid_criteria['action_type'] = action_type.strip()
    if keyword and keyword.strip(): valid_criteria['keyword'] = keyword.strip()
        
    for key, value in valid_criteria.items():
        if key == 'location':
            query = query.filter(models.EnvironmentalAction.location.has(models.Location.name.ilike(f"%{value}%")))
        elif key == 'action_type':
            query = query.filter(models.EnvironmentalAction.action_type.has(models.ActionType.name.ilike(f"%{value}%")))
        elif key == 'keyword':
            query = query.filter(models.EnvironmentalAction.title.ilike(f"%{value}%"))

    actions = query.all()
    if not actions:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκαν δράσεις που να ταιριάζουν στα κριτήριά σας. Δοκιμάστε κάτι άλλο!")
        
    result = []
    for a in actions:
        result.append({
            "id": a.id, "title": a.title, "description": a.description, "max_participants": a.max_participants,
            "location": a.location.name if a.location else "-", "action_type": a.action_type.name if a.action_type else "-",
            "organisation": a.organisation.name if a.organisation else "-"
        })
    return result


@app.post("/actions/{action_id}/participate")
def participate_in_action(action_id: int, data: ParticipateRequest, db: Session = Depends(database.get_db)):
    try:
        user = db.query(models.User).filter(models.User.user_id == data.user_id).first()
        if not user or not user.profile or user.profile.account_type != "volunteer":
            raise HTTPException(status_code=403, detail="Σφάλμα: Μόνο εγγεγραμμένοι εθελοντές μπορούν να δηλώσουν συμμετοχή.")
        
        existing = db.query(models.ParticipationRequest).filter(
            models.ParticipationRequest.user_id == data.user_id,
            models.ParticipationRequest.action_id == action_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Έχετε ήδη δηλώσει συμμετοχή σε αυτή τη δράση.")

        action = db.query(models.EnvironmentalAction).filter(models.EnvironmentalAction.id == action_id).first()
        if not action:
            raise HTTPException(status_code=404, detail="Η δράση δεν βρέθηκε.")
        
        current_participants = db.query(models.ParticipationRequest).filter(
            models.ParticipationRequest.action_id == action_id, 
            models.ParticipationRequest.status == "approved"
        ).count()
        
        if current_participants >= action.max_participants:
            raise HTTPException(status_code=400, detail="Σφάλμα: Η δράση είναι πλήρης. Δεν υπάρχουν διαθέσιμες θέσεις.")
            
        new_participation = models.ParticipationRequest(user_id=data.user_id, action_id=action_id, status="pending")
        db.add(new_participation)
        db.commit()
        
        return {"status": "success", "message": "Επιτυχής δήλωση συμμετοχής! Η αίτησή σας είναι υπό έλεγχο."}

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Σφάλμα Συστήματος: {str(e)}")


# --- USE CASE 7: ΔΙΑΧΕΙΡΙΣΗ ΑΙΤΗΣΕΩΝ & ΕΙΔΟΠΟΙΗΣΕΙΣ ---

@app.get("/api/org-requests/{user_id}")
def get_organisation_requests(user_id: int, db: Session = Depends(database.get_db)):
    """Ανάκτηση Αιτήσεων Συμμετοχής για μια Οργάνωση"""
    org = db.query(models.Organisation).filter(models.Organisation.user_id == user_id).first()
    if not org:
        return []
    
    # Παίρνουμε όλες τις PENDING αιτήσεις για τις δράσεις αυτού του οργανισμού
    requests = db.query(models.ParticipationRequest).join(models.EnvironmentalAction).filter(
        models.EnvironmentalAction.organisation_id == org.id,
        models.ParticipationRequest.status == "pending"
    ).all()
    
    result = []
    for req in requests:
        vol_profile = req.user.profile.volunteer if req.user.profile else None
        result.append({
            "request_id": req.id,
            "action_title": req.action.title,
            "volunteer_name": req.user.profile.full_name if req.user.profile else req.user.username,
            "volunteer_skills": vol_profile.skills if vol_profile else "-",
            "volunteer_resources": vol_profile.resources if vol_profile else "-"
        })
    return result


@app.post("/api/requests/{request_id}/decision")
def process_request_decision(request_id: int, data: DecisionSubmit, db: Session = Depends(database.get_db)):
    """Έλεγχος Απόφασης Οργάνωσης & Δημιουργία Notification"""
    try:
        req = db.query(models.ParticipationRequest).filter(models.ParticipationRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Η αίτηση δεν βρέθηκε.")
        
        # Έλεγχος Δράσης & Δικαιωμάτων (Είναι όντως δική του δράση;)
        action = req.action
        if not action or not action.organisation or action.organisation.user_id != data.org_user_id:
            raise HTTPException(status_code=403, detail="Σφάλμα Ασφαλείας: Δεν έχετε δικαίωμα διαχείρισης σε αυτή τη δράση.")
        
        # Έλεγχος Εθελοντή
        volunteer = req.user
        if not volunteer:
            raise HTTPException(status_code=404, detail="Ο εθελοντής δεν βρέθηκε στο σύστημα.")
        
        # Ενημέρωση Κατάστασης (Λούπα)
        req.status = data.status
        
        # Δημιουργία Ειδοποίησης (Notification)
        status_text = "ΕΓΚΡΙΘΗΚΕ! 🎉" if data.status == "approved" else "απορρίφθηκε."
        notif_msg = f"Η αίτησή σας για τη δράση '{action.title}' μόλις {status_text}"
        
        new_notification = models.Notification(user_id=volunteer.user_id, text=notif_msg)
        db.add(new_notification)
        
        db.commit()
        return {"status": "success", "message": "Επιτυχής ενημέρωση απόφασης!"}

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Σφάλμα Συστήματος: {str(e)}")

@app.get("/api/notifications/{user_id}")
def get_user_notifications(user_id: int, db: Session = Depends(database.get_db)):
    notifs = db.query(models.Notification).filter(models.Notification.user_id == user_id).all()
    return [{"id": n.id, "text": n.text} for n in notifs]

@app.delete("/api/notifications/{user_id}")
def clear_user_notifications(user_id: int, db: Session = Depends(database.get_db)):
    db.query(models.Notification).filter(models.Notification.user_id == user_id).delete()
    db.commit()
    return {"message": "Cleared"}

# --- DB ADMIN VIEWS ---
@app.get("/api/db-view")
def view_database(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    result = []
    for u in users:
        profile = u.profile
        volunteer = profile.volunteer if profile else None
        result.append({
            "id": u.user_id, "username": u.username, "password": u.password, "email": u.email,
            "full_name": profile.full_name if profile else "-", "account_type": profile.account_type if profile else "-",
            "skills": volunteer.skills if volunteer else "-", "resources": volunteer.resources if volunteer else "-"
        })
    return result

@app.get("/api/db-actions")
def view_actions(db: Session = Depends(database.get_db)):
    actions = db.query(models.EnvironmentalAction).all()
    result = []
    for a in actions:
        result.append({
            "id": a.id, "title": a.title, "description": a.description, "max_participants": a.max_participants,
            "location": a.location.name if a.location else "-", "action_type": a.action_type.name if a.action_type else "-",
            "organisation": a.organisation.name if a.organisation else "-"
        })
    return result

@app.get("/api/db-requests")
def view_all_requests(db: Session = Depends(database.get_db)):
    requests = db.query(models.ParticipationRequest).all()
    result = []
    for r in requests:
        result.append({
            "id": r.id,
            "volunteer_name": r.user.profile.full_name if r.user.profile else r.user.username,
            "action_title": r.action.title if r.action else "-",
            "status": r.status
        })
    return result