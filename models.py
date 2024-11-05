from app import db

class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.String(50), unique=True, nullable=False)
    type = db.Column(db.String(50), nullable=False)
    assigned_area = db.Column(db.String(200), nullable=False)
    api_url = db.Column(db.String(200), nullable=True)  # New field for API URL
    phone_number = db.Column(db.String(20))  # New column for phone number

class GPSData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.String(50), db.ForeignKey('vehicle.vehicle_id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    vehicle = db.relationship('Vehicle', backref=db.backref('gps_data', lazy=True))
