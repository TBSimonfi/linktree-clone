from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import bcrypt
import os
from bson import ObjectId
from models import users, links

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "supersecretkey")
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins
jwt = JWTManager(app)

@app.route("/test")
def test():
    return jsonify({"message": "CORS is working!"})

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    print("Signup called", data)
    if not all(k in data for k in ("username", "email", "password")):
        return jsonify({"error": "Missing fields"}), 400
    if users.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already registered"}), 409
    hashed_pw = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())
    users.insert_one({"username": data["username"], "email": data["email"], "password": hashed_pw})
    token = create_access_token(identity=data["email"])
    return jsonify({"token": token, "message": "User registered!"})

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    print("Login called", data)
    user = users.find_one({"email": data.get("email")})
    if user and bcrypt.checkpw(data.get("password", "").encode(), user["password"]):
        token = create_access_token(identity=data["email"])
        return jsonify({"token": token})
    return jsonify({"error": "Invalid credentials!"}), 401

@app.route("/user", methods=["GET"])
@jwt_required()
def get_user():
    email = get_jwt_identity()
    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"username": user["username"]})

@app.route("/add_link", methods=["POST"])
@jwt_required()
def add_link():
    email = get_jwt_identity()
    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.json
    if not all(k in data for k in ("title", "url")):
        return jsonify({"error": "Missing fields"}), 400
    links.insert_one({"user_id": user["_id"], "title": data["title"], "url": data["url"]})
    return jsonify({"message": "Link added!"})

@app.route("/user_links", methods=["GET"])
@jwt_required()
def user_links_route():
    email = get_jwt_identity()
    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    user_links = list(links.find({"user_id": user["_id"]}))
    return jsonify({"links": [{"id": str(link["_id"]), "title": link["title"], "url": link["url"]} for link in user_links]})

@app.route("/delete_link/<link_id>", methods=["DELETE"])
@jwt_required()
def delete_link(link_id):
    email = get_jwt_identity()
    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    result = links.delete_one({"_id": ObjectId(link_id), "user_id": user["_id"]})
    if result.deleted_count == 0:
        return jsonify({"error": "Link not found or not authorized"}), 404
    return jsonify({"message": "Link deleted!"})

#if __name__ == "__main__":
#    app.run(debug=True)
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
