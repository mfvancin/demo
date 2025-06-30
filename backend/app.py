import os
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Dummy data
users = {
    "1": {"id": "1", "email": "patient@test.com", "role": "patient", "name": "John Doe"},
    "2": {"id": "2", "email": "doctor@test.com", "role": "doctor", "name": "Dr. Smith"},
}

patients = {
    "1": {
        "id": "1",
        "name": "John Doe",
        "recovery_process": [
            {"id": "rp1", "name": "Knee Bends", "completed": False},
            {"id": "rp2", "name": "Leg Raises", "completed": True},
        ]
    }
}

doctors_patients = {
    "2": ["1"]
}


@app.route("/")
def home():
    return "irhis Backend"

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password') # In a real app, you'd hash and check this

    for user_id, user in users.items():
        if user['email'] == email:
            # Fake auth
            return jsonify({"token": "fake-jwt-token", "user": user})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    name = data.get('name')

    if not all([email, password, role, name]):
        return jsonify({"error": "Missing fields"}), 400

    new_id = str(len(users) + 1)
    users[new_id] = {"id": new_id, "email": email, "role": role, "name": name}

    if role == 'patient':
        patients[new_id] = {"id": new_id, "name": name, "recovery_process": []}
    
    # In a real app, you'd associate the new patient with a doctor
    # For now, we can just add them to the system

    return jsonify({"token": "fake-jwt-token", "user": users[new_id]})


@app.route('/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    patient = patients.get(patient_id)
    if patient:
        return jsonify(patient)
    return jsonify({"error": "Patient not found"}), 404

@app.route('/doctors/<doctor_id>/patients', methods=['GET'])
def get_doctor_patients(doctor_id):
    patient_ids = doctors_patients.get(doctor_id, [])
    doctor_patients = [patients[p_id] for p_id in patient_ids if p_id in patients]
    return jsonify(doctor_patients)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port) 