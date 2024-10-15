# models.py
from werkzeug.security import generate_password_hash, check_password_hash

users = {}  # In-memory storage for user data

class User:
    def __init__(self, username, password):
        self.username = username
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
