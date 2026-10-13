# app.py — Main Flask application

from flask import Flask
from flask_cors import CORS
from routes.detection import detection_bp
from routes.alerts import alerts_bp
from routes.refugee import refugee_bp
from routes.analysis import analysis_bp

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", 
                    "http://127.0.0.1:5173"]
    }
})

# Register blueprints
app.register_blueprint(detection_bp, url_prefix='/api')
app.register_blueprint(alerts_bp, url_prefix='/api')
app.register_blueprint(refugee_bp, url_prefix='/api')
app.register_blueprint(analysis_bp, url_prefix='/api')

@app.route('/api/health', methods=['GET'])
def health():
    return {'status': 'Seema Setu Backend Running', 'version': '1.0.0'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)