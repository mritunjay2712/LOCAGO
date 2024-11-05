
Overview
Locago is a Flask-based web application for vehicle tracking, emergency services, and location-based alerts. It uses PostgreSQL for data storage and integrates with a variety of services.

## Steps to Run the Web Application

cd locago

Create a virtual environment and activate it:
python -m venv venv source venv/bin/activate # On Windows use venv\Scripts\activate

Install the required Python packages:
pip install -r requirements.txt


Set Up Environment Variables
Create a `.env` file in the project root and add the following environment variables:
SECRET_KEY=LOCAGO
DATABASE_URL=postgresql://postgres:Tanveer%401234@localhost/gps_tracking_db


Replace `username`, `password`, and `your_secret_key` with your actual PostgreSQL credentials and a secure key.

Initialize the Database
Run the following command to set up the database schema:
flask db upgrade


Run the Flask application:
python app.py
