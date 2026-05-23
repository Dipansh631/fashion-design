from flask import Flask, request, jsonify
import random
import os

# Manual .env parser to avoid external dependency issues
def load_env():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, val = line.split('=', 1)
                    # Strip quotes if present
                    val = val.strip().strip('"').strip("'")
                    os.environ[key.strip()] = val

load_env()

app = Flask(__name__)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        return response

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

# Mock database for verification codes
verification_codes = {}

@app.route('/request-verification', methods=['POST', 'OPTIONS'])
def request_verification():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})
    data = request.json
    mobile_no = data.get('mobile_no')
    if not mobile_no:
        return jsonify({"error": "Mobile number is required"}), 400
    
    # Generate a random 6-digit code (Mock OTP)
    code = str(random.randint(100000, 999999))
    verification_codes[mobile_no] = code
    
    # Try sending real SMS via Twilio if configured in .env
    sms_sent = False
    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_auth = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_number = os.environ.get("TWILIO_PHONE_NUMBER")

    if twilio_sid and twilio_auth and twilio_number:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_auth)
            message = client.messages.create(
                body=f"Your Vogue Artisan verification code is: {code}",
                from_=twilio_number,
                to=mobile_no
            )
            print(f"[{mobile_no}] Real SMS sent via Twilio! SID: {message.sid}")
            sms_sent = True
        except Exception as e:
            print(f"[{mobile_no}] Failed to send real SMS via Twilio: {str(e)}")
            print(f"Fallback Mock verification code for {mobile_no}: {code}")
    else:
        print(f"Verification code for {mobile_no}: {code} (Twilio not configured in .env)")
        
    return jsonify({"status": "success", "message": "Verification code sent"})

@app.route('/verify', methods=['POST', 'OPTIONS'])
def verify_code():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})
    data = request.json
    mobile_no = data.get('mobile_no')
    code = data.get('code')
    
    if verification_codes.get(mobile_no) == code:
        # In real life, update the user status in main database
        return jsonify({"status": "verified", "message": "Business verified successfully"})
    else:
        return jsonify({"error": "Invalid verification code"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)
