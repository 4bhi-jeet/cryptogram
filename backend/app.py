from flask import Flask, jsonify, send_from_directory, request
import os
from main import create_puzzle, hash_mapping

app = Flask(__name__, static_folder="../frontend", static_url_path="")

# Store the current puzzle in memory
current_puzzle = None

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")
 
@app.route("/puzzle", methods=["GET"])
def get_puzzle():
  global current_puzzle
  current_puzzle = create_puzzle()
  return jsonify(current_puzzle)

@app.route("/check", methods=["POST"])
def check_solution():
  global current_puzzle
  if not current_puzzle:
    return jsonify({"error": "No active puzzle"}), 400

  data = request.get_json()
  guessed_mapping = data.get("mapping")

  if not guessed_mapping:
    return jsonify({"error": "Mapping required"}), 400

  guessed_hash = hash_mapping(guessed_mapping)

  if guessed_hash == current_puzzle["mapping_hash"]:
    return jsonify({"result": "correct"})
  else:
    return jsonify({"result": "incorrect"})

@app.route("/check_letter", methods=["POST"])
def check_letter():
    global current_puzzle
    if not current_puzzle:
      return jsonify({"error": "No active puzzle"}), 400

    data = request.get_json() or {}
    token = (data.get("token") or "").upper().strip()
    letter = (data.get("letter") or "").upper().strip()

    if token is None or letter == "":
      return jsonify({"error": "number and letter required"}), 400

    # Our mapping in main.py is letters -> numbers (int). Build reverse mapping number_str -> letter.
    mapping = current_puzzle.get("mapping", {})  # e.g. {'A': 12, 'B': 5, ...}
    # create reverse: number_as_str -> letter
    reverse = {str(v): k for k, v in mapping.items()}

    if token not in reverse:
      return jsonify({"error": "invalid token"}), 400

    correct_letter = reverse[token]  # e.g. 'T'
    is_correct = (correct_letter == letter)

    return jsonify({"correct": is_correct})

@app.route("/ping")
def ping():
    return {"status": "ok"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
