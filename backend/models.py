from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    profile = relationship("Profile", back_populates="user", uselist=False)

class Profile(Base):
    __tablename__ = "profiles"
    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    full_name = Column(String)
    account_type = Column(String, default="volunteer")
    user = relationship("User", back_populates="profile")
    volunteer = relationship("VolunteerProfile", back_populates="profile", uselist=False)

class VolunteerProfile(Base):
    __tablename__ = "volunteer_profiles"
    vol_id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.profile_id"))
    skills = Column(String)
    resources = Column(String)
    profile = relationship("Profile", back_populates="volunteer")

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class ActionType(Base):
    __tablename__ = "action_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Organisation(Base):
    __tablename__ = "organisations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    name = Column(String, index=True)

class EnvironmentalAction(Base):
    __tablename__ = "environmental_actions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    max_participants = Column(Integer, default=0)
    
    location_id = Column(Integer, ForeignKey("locations.id"))
    action_type_id = Column(Integer, ForeignKey("action_types.id"))
    organisation_id = Column(Integer, ForeignKey("organisations.id"))
    
    location = relationship("Location")
    action_type = relationship("ActionType")
    organisation = relationship("Organisation")

class ParticipationRequest(Base):
    __tablename__ = "participation_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    action_id = Column(Integer, ForeignKey("environmental_actions.id"))
    status = Column(String, default="pending") # pending, approved, rejected
    
    user = relationship("User")
    action = relationship("EnvironmentalAction")

# --- ΝΕΟΣ ΠΙΝΑΚΑΣ ΓΙΑ ΕΙΔΟΠΟΙΗΣΕΙΣ (USE CASE 7) ---
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    text = Column(String)
    
    user = relationship("User")