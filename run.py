from app import app, db
from app.models import User, Product, Order, OrderItem

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database initialized successfully!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
