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