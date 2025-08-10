from flask import Flask, jsonify
from main import create_puzzle

app = Flask(__name__)

@app.route("/get_puzzle", methods=["GET"])
def get_puzzle():
    puzzle = create_puzzle()
    return jsonify(puzzle)

if __name__ == "__main__":
    app.run(debug=True)
