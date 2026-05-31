from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import models, database
import uuid
import random

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
    status: str

class CampaignCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str
    goal_amount: int = Field(..., gt=0)
    action_id: int
    creator_user_id: int

class DonationSubmit(BaseModel):
    sponsor_id: int
    campaign_id: int
    amount: int = Field(..., gt=0)
    card_number: str

class ProposalConvertRequest(BaseModel):
    user_id: int

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
        raise HTTPException(status_code=404, detail="Δεν βρέθηκαν δράσεις που να ταιριάζουν στα κριτήριά σας.")
        
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
            
        creator = db.query(models.User).filter(models.User.user_id == action.organisation.user_id).first()
        is_org = creator.profile.account_type == "organisation" if creator and creator.profile else False
        
        request_status = "pending" if is_org else "approved"
        new_participation = models.ParticipationRequest(user_id=data.user_id, action_id=action_id, status=request_status)
        db.add(new_participation)
        db.commit()
        
        success_msg = "Επιτυχής δήλωση συμμετοχής! Η αίτησή σας είναι υπό έλεγχο." if is_org else "Επιτυχής δήλωση! Εγκριθήκατε αυτόματα για τη δράση."
        return {"status": "success", "message": success_msg}

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Σφάλμα Συστήματος: {str(e)}")
    
    
# --- ΔΙΑΧΕΙΡΙΣΗ ΑΙΤΗΣΕΩΝ & ΕΙΔΟΠΟΙΗΣΕΙΣ ---
@app.get("/api/org-requests/{user_id}")
def get_organisation_requests(user_id: int, db: Session = Depends(database.get_db)):
    org = db.query(models.Organisation).filter(models.Organisation.user_id == user_id).first()
    if not org: return []
    
    requests = db.query(models.ParticipationRequest).join(models.EnvironmentalAction).filter(
        models.EnvironmentalAction.organisation_id == org.id,
        models.ParticipationRequest.status == "pending"
    ).all()
    
    result = []
    for req in requests:
        vol_profile = req.user.profile.volunteer if req.user.profile else None
        result.append({
            "request_id": req.id, "action_title": req.action.title,
            "volunteer_name": req.user.profile.full_name if req.user.profile else req.user.username,
            "volunteer_skills": vol_profile.skills if vol_profile else "-",
            "volunteer_resources": vol_profile.resources if vol_profile else "-"
        })
    return result

@app.post("/api/requests/{request_id}/decision")
def process_request_decision(request_id: int, data: DecisionSubmit, db: Session = Depends(database.get_db)):
    try:
        req = db.query(models.ParticipationRequest).filter(models.ParticipationRequest.id == request_id).first()
        if not req: raise HTTPException(status_code=404, detail="Η αίτηση δεν βρέθηκε.")
        
        action = req.action
        if not action or not action.organisation or action.organisation.user_id != data.org_user_id:
            raise HTTPException(status_code=403, detail="Δεν έχετε δικαίωμα διαχείρισης σε αυτή τη δράση.")
        
        volunteer = req.user
        if not volunteer: raise HTTPException(status_code=404, detail="Ο εθελοντής δεν βρέθηκε.")
        
        req.status = data.status
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
        raise HTTPException(status_code=500, detail=str(e))

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


# --- USE CASE 8: ΚΑΜΠΑΝΙΕΣ ---
@app.get("/api/user-actions/{user_id}")
def get_user_actions(user_id: int, db: Session = Depends(database.get_db)):
    org = db.query(models.Organisation).filter(models.Organisation.user_id == user_id).first()
    if not org: return []
    actions = db.query(models.EnvironmentalAction).filter(models.EnvironmentalAction.organisation_id == org.id).all()
    return [{"id": a.id, "title": a.title} for a in actions]

@app.post("/api/campaigns")
def create_campaign(data: CampaignCreate, db: Session = Depends(database.get_db)):
    try:
        if data.goal_amount <= 0: raise HTTPException(status_code=400, detail="Το ποσό πρέπει να είναι έγκυρο.")
        action = db.query(models.EnvironmentalAction).filter(models.EnvironmentalAction.id == data.action_id).first()
        if not action: raise HTTPException(status_code=404, detail="Η δράση δεν βρέθηκε.")

        org = db.query(models.Organisation).filter(models.Organisation.user_id == data.creator_user_id).first()
        if not org or action.organisation_id != org.id:
            raise HTTPException(status_code=403, detail="Μόνο ο διοργανωτής της δράσης δημιουργεί καμπάνια.")

        new_campaign = models.FundraisingCampaign(
            title=data.title, description=data.description, goal_amount=data.goal_amount,
            action_id=data.action_id, creator_user_id=data.creator_user_id
        )
        db.add(new_campaign)
        db.commit()
        return {"status": "success", "message": "Η καμπάνια καταχωρήθηκε επιτυχώς!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/campaigns")
def get_all_campaigns(db: Session = Depends(database.get_db)):
    campaigns = db.query(models.FundraisingCampaign).all()
    result = []
    for c in campaigns:
        result.append({
            "id": c.id, "title": c.title, "description": c.description,
            "goal_amount": c.goal_amount, "current_amount": c.current_amount,
            "action_title": c.action.title if c.action else "-",
            "organisation": c.action.organisation.name if c.action and c.action.organisation else "-"
        })
    return result


# --- USE CASE 9: ΕΠΕΞΕΡΓΑΣΙΑ ΔΩΡΕΑΣ ---
@app.post("/api/donate")
def process_donation(data: DonationSubmit, db: Session = Depends(database.get_db)):
    try:
        sponsor = db.query(models.User).filter(models.User.user_id == data.sponsor_id).first()
        if not sponsor or not sponsor.profile or sponsor.profile.account_type != "sponsor":
            raise HTTPException(status_code=403, detail="Μόνο εγγεγραμμένοι χορηγοί (sponsors) μπορούν να κάνουν δωρεά.")
            
        if len(data.card_number) < 16:
            raise HTTPException(status_code=400, detail="Μη έγκυρος αριθμός κάρτας. Παρακαλώ ελέγξτε τα στοιχεία σας.")

        campaign = db.query(models.FundraisingCampaign).filter(models.FundraisingCampaign.id == data.campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Η καμπάνια δεν βρέθηκε στο σύστημα.")
        
        action = campaign.action
        if not action:
            raise HTTPException(status_code=404, detail="Η καμπάνια δεν έχει συνδεδεμένη έγκυρη περιβαλλοντική δράση.")

        new_donation = models.Donation(sponsor_id=data.sponsor_id, campaign_id=data.campaign_id, amount=data.amount)
        db.add(new_donation)
        db.flush() 

        new_payment = models.Payment(donation_id=new_donation.id, status="completed")
        db.add(new_payment)

        receipt_no = f"REC-{uuid.uuid4().hex[:8].upper()}"
        new_receipt = models.Receipt(donation_id=new_donation.id, receipt_number=receipt_no)
        db.add(new_receipt)

        campaign.current_amount += data.amount
        db.commit()
        return {"status": "success", "message": "Επιτυχής δωρεά! Σας ευχαριστούμε.", "receipt": receipt_no}

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# --- USE CASE 10: ΑΝΑΛΥΣΗ ΚΑΙ ΠΡΟΤΑΣΕΙΣ ΔΡΑΣΕΩΝ ---
@app.post("/api/analyze-needs")
def analyze_environmental_data(db: Session = Depends(database.get_db)):
    try:
        if random.random() < 0.2:
            return {"status": "info", "message": "Δεν εντοπίστηκε νέα περιβαλλοντική ανάγκη αυτή τη στιγμή."}
        
        mock_data = [
            {"loc": "Πάρκο Αντώνης Τρίτσης", "desc": "Μειωμένη βλάστηση και ξηρασία εδάφους λόγω παρατεταμένου καύσωνα.", "type": "Δενδροφύτευση", "title": "Άμεση αναδάσωση και πότισμα στο Πάρκο"},
            {"loc": "Παραλία Βοτσαλάκια", "desc": "Εντοπίστηκε υψηλή συγκέντρωση μικροπλαστικών και απορριμμάτων μετά από κακοκαιρία.", "type": "Καθαρισμός Παραλίας", "title": "Επείγων καθαρισμός ακτής"},
            {"loc": "Πεντέλη", "desc": "Αυξημένος κίνδυνος πυρκαγιάς λόγω μεγάλης συσσώρευσης ξερών κλαδιών (εύφλεκτη ύλη).", "type": "Πυροπροστασία / Δασοπροστασία", "title": "Αποψίλωση και καθαρισμός ξερών χόρτων"}
        ]
        
        selected = random.choice(mock_data)
        
        loc = db.query(models.Location).filter(models.Location.name == selected["loc"]).first()
        if not loc:
            loc = models.Location(name=selected["loc"])
            db.add(loc)
            db.flush()
            
        act_type = db.query(models.ActionType).filter(models.ActionType.name == selected["type"]).first()
        if not act_type:
            act_type = models.ActionType(name=selected["type"])
            db.add(act_type)
            db.flush()
            
        new_need = models.EnvironmentalNeed(location_id=loc.id, description=selected["desc"], severity="high")
        db.add(new_need)
        db.flush()
        
        new_proposal = models.ActionProposal(
            need_id=new_need.id,
            action_type_id=act_type.id,
            title=selected["title"],
            description=f"Βάσει δεδομένων: {selected['desc']} Προτείνεται κινητοποίηση."
        )
        db.add(new_proposal)
        db.commit()
        
        return {"status": "success", "message": "Επιτυχής καταχώρηση. Εντοπίστηκε νέα ανάγκη!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/action-proposals")
def get_action_proposals(db: Session = Depends(database.get_db)):
    proposals = db.query(models.ActionProposal).filter(models.ActionProposal.status == "proposed").order_by(models.ActionProposal.id.desc()).limit(5).all()
    res = []
    for p in proposals:
        res.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "location": p.need.location.name if p.need and p.need.location else "-",
            "action_type": p.action_type.name if p.action_type else "-"
        })
    return res

@app.post("/api/action-proposals/{proposal_id}/convert")
def convert_proposal_to_action(proposal_id: int, data: ProposalConvertRequest, db: Session = Depends(database.get_db)):
    try:
        proposal = db.query(models.ActionProposal).filter(models.ActionProposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Η πρόταση δεν βρέθηκε.")
        if proposal.status == "converted_to_action":
            raise HTTPException(status_code=400, detail="Αυτή η πρόταση έχει ήδη μετατραπεί σε δράση.")

        org = db.query(models.Organisation).filter(models.Organisation.user_id == data.user_id).first()
        if not org:
            user_profile = db.query(models.Profile).filter(models.Profile.user_id == data.user_id).first()
            org_name = user_profile.full_name if user_profile else f"Οργανισμός User {data.user_id}"
            org = models.Organisation(user_id=data.user_id, name=org_name)
            db.add(org)
            db.flush()

        new_action = models.EnvironmentalAction(
            title=proposal.title,
            description=proposal.description,
            max_participants=20, 
            location_id=proposal.need.location_id,
            action_type_id=proposal.action_type_id,
            organisation_id=org.id
        )
        db.add(new_action)

        proposal.status = "converted_to_action"
        db.commit()

        return {"status": "success", "message": "Συγχαρητήρια! Η πρόταση μετατράπηκε σε επίσημη δράση."}

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    from datetime import date

# (Πρόσθεσε αυτό στα Pydantic Schemas ψηλά)
class CertificateIssue(BaseModel):
    user_id: int
    action_id: int


# --- USE CASE 11: ΠΙΣΤΟΠΟΙΗΤΙΚΑ & PDF ---
@app.get("/api/user-approved-actions/{user_id}")
def get_approved_actions(user_id: int, db: Session = Depends(database.get_db)):
    # Φέρνει τις δράσεις που ο εθελοντής έχει ΕΓΚΡΙΘΕΙ
    participations = db.query(models.ParticipationRequest).filter(
        models.ParticipationRequest.user_id == user_id,
        models.ParticipationRequest.status == "approved"
    ).all()
    
    # Ελέγχει αν έχει ήδη εκδοθεί πιστοποιητικό για αυτές
    issued_certs = [c.action_id for c in db.query(models.Certificate).filter(models.Certificate.user_id == user_id).all()]
    
    res = []
    for p in participations:
        res.append({
            "action_id": p.action_id,
            "action_title": p.action.title,
            "organisation": p.action.organisation.name if p.action.organisation else "-",
            "has_certificate": p.action_id in issued_certs
        })
    return res

@app.post("/api/certificates/issue")
def issue_certificate(data: CertificateIssue, db: Session = Depends(database.get_db)):
    try:
        # 1. ΕΛΕΓΧΟΣ ΕΓΚΥΡΗΣ ΣΥΜΜΕΤΟΧΗΣ
        participation = db.query(models.ParticipationRequest).filter(
            models.ParticipationRequest.user_id == data.user_id,
            models.ParticipationRequest.action_id == data.action_id,
            models.ParticipationRequest.status == "approved"
        ).first()

        if not participation:
            raise HTTPException(status_code=400, detail="Σφάλμα: Δεν βρέθηκε εγκεκριμένη συμμετοχή.")

        # 2. ΕΛΕΓΧΟΣ ΑΝ ΕΧΕΙ ΗΔΗ ΕΚΔΟΘΕΙ
        existing = db.query(models.Certificate).filter(
            models.Certificate.user_id == data.user_id,
            models.Certificate.action_id == data.action_id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Το πιστοποιητικό έχει ήδη εκδοθεί.")

        # 3. ΔΗΜΙΟΥΡΓΙΑ ΠΙΣΤΟΠΟΙΗΤΙΚΟΥ
        new_cert = models.Certificate(
            user_id=data.user_id,
            action_id=data.action_id,
            issue_date=date.today().strftime("%d/%m/%Y")
        )
        db.add(new_cert)
        db.flush()

        # 4. ΔΗΜΙΟΥΡΓΙΑ ΕΙΔΟΠΟΙΗΣΗΣ
        action = participation.action
        notif_msg = f"🏆 ΝΕΟ ΠΙΣΤΟΠΟΙΗΤΙΚΟ: Το πιστοποιητικό σας για τη δράση '{action.title}' εκδόθηκε!"
        new_notif = models.Notification(user_id=data.user_id, text=notif_msg)
        db.add(new_notif)

        db.commit()
        return {"status": "success", "message": "Το πιστοποιητικό εκδόθηκε επιτυχώς!"}
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/certificates/{user_id}")
def get_user_certificates(user_id: int, db: Session = Depends(database.get_db)):
    certs = db.query(models.Certificate).filter(models.Certificate.user_id == user_id).all()
    result = []
    for c in certs:
        result.append({
            "id": c.id,
            "action_title": c.action.title,
            "organisation": c.action.organisation.name if c.action.organisation else "-",
            "issue_date": c.issue_date,
            "volunteer_name": c.user.profile.full_name if c.user.profile else c.user.username
        })
    return result