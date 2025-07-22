import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt as PyJWT
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your-secret-key'  # In production, use a secure secret key

# Database simulation (replace with real database in production)
users = {}
patients = {}
doctors_patients = {}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = PyJWT.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route("/")
def home():
    return "irhis Backend"

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    if not email or not password or not role:
        return jsonify({"error": "Missing email, password, or role"}), 400

    # Find user by email
    user = next((user for user in users.values() if user['email'] == email), None)
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Verify role matches
    if user['role'] != role:
        return jsonify({"error": "Invalid role for this user"}), 401

    # Generate token
    token = PyJWT.encode({
        'user_id': user['id'],
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'])

    return jsonify({
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "role": user['role']
        }
    })

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    name = data.get('name')

    if not all([email, password, role, name]):
        return jsonify({"error": "Missing required fields"}), 400

    # Check if email already exists
    if any(user['email'] == email for user in users.values()):
        return jsonify({"error": "Email already registered"}), 409

    # Create new user
    user_id = str(len(users) + 1)
    hashed_password = generate_password_hash(password)
    
    users[user_id] = {
        "id": user_id,
        "email": email,
        "password": hashed_password,
        "role": role,
        "name": name
    }

    if role == 'patient':
        patients[user_id] = {
            "id": user_id,
            "name": name,
            "recovery_process": []
        }

    # Generate token
    token = PyJWT.encode({
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'])

    return jsonify({
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "role": role
        }
    })

@app.route('/patients/<patient_id>', methods=['GET'])
@token_required
def get_patient(current_user, patient_id):
    # Check if user has access to this patient
    if current_user['role'] != 'doctor' and current_user['id'] != patient_id:
        return jsonify({"error": "Unauthorized"}), 403

    patient = patients.get(patient_id)
    if patient:
        return jsonify(patient)
    return jsonify({"error": "Patient not found"}), 404

@app.route('/doctors/<doctor_id>/patients', methods=['GET'])
@token_required
def get_doctor_patients(current_user, doctor_id):
    # Check if user is the doctor
    if current_user['role'] != 'doctor' or current_user['id'] != doctor_id:
        return jsonify({"error": "Unauthorized"}), 403

    patient_ids = doctors_patients.get(doctor_id, [])
    doctor_patients = [patients[p_id] for p_id in patient_ids if p_id in patients]
    return jsonify(doctor_patients)

@app.route('/patients/<patient_id>/assign-doctor', methods=['POST'])
@token_required
def assign_doctor(current_user, patient_id):
    if current_user['role'] != 'doctor':
        return jsonify({"error": "Only doctors can assign patients"}), 403

    if patient_id not in patients:
        return jsonify({"error": "Patient not found"}), 404

    doctor_id = current_user['id']
    if doctor_id not in doctors_patients:
        doctors_patients[doctor_id] = []
    
    if patient_id not in doctors_patients[doctor_id]:
        doctors_patients[doctor_id].append(patient_id)

    return jsonify({"message": "Patient assigned successfully"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 