
from flask import Flask, request, jsonify
from transformers import pipeline
import os
import json
from datetime import datetime, timedelta

app = Flask(__name__)
classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")



HAZARD_KEYWORDS = ["wave", "tsunami", "flood", "spill", "drown", "boat", "sink", "debris", "oil"]
CANDIDATE_LABELS = ["ocean hazard", "spam", "weather report", "not relevant"]

# 3. Create the API endpoint that your Node.js backend will call
@app.route('/verify-hazard', methods=['POST'])
def verify_hazard():
    data = request.get_json() or {}
    description = (data.get('description') or '').lower()
    report_type = (data.get('type') or '').lower()
    report_location = (data.get('location') or '').strip().lower()
    report_pincode = (data.get('pincode') or '').strip()
    
    # Load persisted reports and compute counts for the whole dataset
    history_score = 0.0
    try:
        backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
        data_file = os.path.join(backend_root, 'data', 'reports.json')
        if os.path.exists(data_file):
            with open(data_file, 'r', encoding='utf-8') as f:
                payload = json.load(f) or {}
                reports = payload.get('reports') if isinstance(payload, dict) else payload
                if not isinstance(reports, list):
                    reports = []

                # Full-dataset counts for same (type, pincode)
                pair_count = 0
                type_count = 0
                for r in reports:
                    r_type = (r.get('type') or '').lower()
                    r_pin = (r.get('pincode') or '').strip()
                    if report_type and report_type == r_type:
                        type_count += 1
                        if report_pincode and report_pincode == r_pin:
                            pair_count += 1
                # Map counts to scores with a soft cap (3 occurrences → score 1.0)
                consensus_score = min(1.0, pair_count / 3.0) if pair_count > 0 else 0.0
                history_score = min(1.0, type_count / 3.0) if type_count > 0 else 0.0
                # Store for logging/response
                counts = {"type_count": type_count, "pair_count": pair_count}
    except Exception:
        # If file missing or unreadable, keep history_score at 0.0
        history_score = 0.0
        consensus_score = 0.0
        counts = {"type_count": 0, "pair_count": 0}

    # A. Check for keywords
    keyword_score = 1.0 if any(keyword in description for keyword in HAZARD_KEYWORDS) else 0.0
            
    # Skip NLP/description-based scoring per requirement; rely purely on type+pincode corroboration
    nlp_score = 0.0
    keyword_score = 0.0
    
    # Final confidence depends only on corroboration signals
    # Weights: 60% consensus (same type+pincode), 40% history (same type volume)
    final_confidence = (consensus_score * 0.60) + (history_score * 0.40)

    # If caller asks for aggregate across all reports of same (type,pincode), compute it
    # by iterating unique pairs in history and attaching an aggregates field.
    aggregates = None
    try:
        backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
        data_file = os.path.join(backend_root, 'data', 'reports.json')
        if os.path.exists(data_file):
            with open(data_file, 'r', encoding='utf-8') as f:
                payload = json.load(f) or {}
                reports = payload.get('reports') if isinstance(payload, dict) else payload
                if isinstance(reports, list):
                    pairs = {}
                    for r in reports[-200:]:
                        t = (r.get('type') or '').lower()
                        p = (r.get('pincode') or '').strip()
                        if not t or not p:
                            continue
                        pairs.setdefault((t, p), 0)
                        pairs[(t, p)] += 1
                    # Compute a simple aggregate confidence per pair using same formula mapping corroborations → consensus
                    aggregates = [
                        {
                            "type": t,
                            "pincode": p,
                            "count": c,
                            "consensus": min(1.0, c / 3.0),
                            "history": min(1.0, c / 3.0),
                            "confidence": round(((min(1.0, c / 3.0) * 0.60) + (min(1.0, c / 3.0) * 0.40)), 3)
                        }
                        for (t, p), c in pairs.items()
                    ]
    except Exception:
        aggregates = None
    
    # D. Decide if it's a hazard based on a threshold (e.g., 70%)
    is_hazard = final_confidence > 0.70
    
    # 4. Send the final decision back to your Node.js backend
    # Log to terminal for verification
    try:
        print(
            f"[AI] is_hazard={is_hazard} confidence={round(final_confidence, 3)} "
            f"components(history={round(history_score,3)}, consensus={round(consensus_score,3)}) "
            f"counts(type={counts['type_count']}, pair={counts['pair_count']}) "
            f"(type='{report_type}', pincode='{report_pincode}')"
        )
    except Exception:
        pass

    return jsonify({
        "isHazard": is_hazard,
        "confidence": round(final_confidence, 3),
        "components": {
            "nlp": round(nlp_score, 3),
            "keywords": round(keyword_score, 3),
            "history": round(history_score, 3),
            "consensus": round(consensus_score, 3),
            "counts": counts
        },
        "aggregates": aggregates
    })

# 5. Run the server
if __name__ == '__main__':
    print("Starting AI verification server on http://localhost:8000")
    app.run(port=8000, debug=True)
