from app import app, db
from werkzeug.security import generate_password_hash
from app.models import User, Product

def init_db():
    """Initialize database with sample data"""
    with app.app_context():
        # Create tables
        db.create_all()
        print("Database tables created!")
        
        # Check if demo user exists
        demo_user = User.query.filter_by(username='demo').first()
        if not demo_user:
            # Create demo user
            demo_user = User(
                username='demo',
                password_hash=generate_password_hash('demo123'),
                restaurant_name='Restaurante Demo'
            )
            db.session.add(demo_user)
            db.session.commit()
            print("Demo user created! Username: demo, Password: demo123")
            
            # Add sample products
            sample_products = [
                {'name': 'Hamburguesa Clásica', 'description': 'Hamburguesa con carne, lechuga, tomate', 'price': 12.99, 'category': 'Comidas'},
                {'name': 'Pizza Margarita', 'description': 'Pizza con queso mozzarella y albahaca', 'price': 15.99, 'category': 'Comidas'},
                {'name': 'Ensalada César', 'description': 'Lechuga romana, pollo, crutones', 'price': 9.99, 'category': 'Ensaladas'},
                {'name': 'Coca-Cola', 'description': 'Refresco 500ml', 'price': 2.50, 'category': 'Bebidas'},
                {'name': 'Agua Mineral', 'description': 'Agua mineral 500ml', 'price': 1.50, 'category': 'Bebidas'},
                {'name': 'Café Americano', 'description': 'Café negro', 'price': 3.00, 'category': 'Bebidas'},
                {'name': 'Pastel de Chocolate', 'description': 'Delicioso pastel de chocolate', 'price': 6.99, 'category': 'Postres'},
            ]
            
            for product_data in sample_products:
                product = Product(
                    name=product_data['name'],
                    description=product_data['description'],
                    price=product_data['price'],
                    category=product_data['category'],
                    user_id=demo_user.id
                )
                db.session.add(product)
            
            db.session.commit()
            print(f"Added {len(sample_products)} sample products!")
        else:
            print("Demo user already exists!")

if __name__ == '__main__':
    init_db()
