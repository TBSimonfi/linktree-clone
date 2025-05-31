pip install flask pymongo flask-bcrypt flask-jwt-extended python-dotenv
test
python app.py

backend/
│── app.py               # Main Flask API
│── models.py            # Database schema (MongoDB)
│── routes.py            # API routes (Signup, Login, Links)
│── requirements.txt     # Dependencies
│── config.py            # Environment variables
│── .env                 # Secrets (JWT key)

frontend/
│── index.html         # Landing page
│── signup.html        # User registration
│── login.html         # User login
│── dashboard.html     # User dashboard
│── links.html         # Manage links
│── styles.css         # Custom styles
│── script.js          # JavaScript logic

