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

    from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

# ... (Κρατάς τους υπάρχοντες πίνακες User, Profile, VolunteerProfile)

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # π.χ. "Πάτρα", "Αθήνα"

class ActionType(Base):
    __tablename__ = "action_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # π.χ. "Δενδροφύτευση", "Καθαρισμός Ακτής"

class Organisation(Base):
    __tablename__ = "organisations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    name = Column(String, index=True)
    
    user = relationship("User")

class EnvironmentalAction(Base):
    __tablename__ = "environmental_actions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    max_participants = Column(Integer, default=0)
    
    # Ξένα Κλειδιά / Συνδέσεις (Use Case Requirements)
    location_id = Column(Integer, ForeignKey("locations.id"))
    action_type_id = Column(Integer, ForeignKey("action_types.id"))
    organisation_id = Column(Integer, ForeignKey("organisations.id"))
    
    # Relationships για εύκολη ανάκτηση δεδομένων
    location = relationship("Location")
    action_type = relationship("ActionType")
    organisation = relationship("Organisation")