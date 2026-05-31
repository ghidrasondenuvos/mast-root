from sqlalchemy import Column, Integer, String
from database import Base

class EnvironmentalAction(Base):
    __tablename__ = "environmental_actions"
    
    action_id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    max_participants = Column(Integer)
    status = Column(String, default="Active")