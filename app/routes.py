from flask import render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app import app, db, login_manager
from app.models import User, Product, Order, OrderItem
from datetime import datetime

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('pos'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('pos'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('pos'))
        else:
            flash('Usuario o contraseña incorrectos', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('pos'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        restaurant_name = request.form.get('restaurant_name')
        
        if User.query.filter_by(username=username).first():
            flash('El usuario ya existe', 'error')
            return redirect(url_for('register'))
        
        user = User(
            username=username,
            password_hash=generate_password_hash(password),
            restaurant_name=restaurant_name
        )
        db.session.add(user)
        db.session.commit()
        
        flash('Registro exitoso. Por favor inicia sesión.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/pos')
@login_required
def pos():
    products = Product.query.filter_by(user_id=current_user.id, available=True).all()
    return render_template('pos.html', products=products)

@app.route('/products')
@login_required
def products():
    products = Product.query.filter_by(user_id=current_user.id).all()
    return render_template('products.html', products=products)

@app.route('/products/add', methods=['POST'])
@login_required
def add_product():
    data = request.json
    product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=float(data['price']),
        category=data.get('category', ''),
        user_id=current_user.id
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({'success': True, 'id': product.id})

@app.route('/products/<int:product_id>/delete', methods=['POST'])
@login_required
def delete_product(product_id):
    product = Product.query.filter_by(id=product_id, user_id=current_user.id).first_or_404()
    db.session.delete(product)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/products/<int:product_id>/toggle', methods=['POST'])
@login_required
def toggle_product(product_id):
    product = Product.query.filter_by(id=product_id, user_id=current_user.id).first_or_404()
    product.available = not product.available
    db.session.commit()
    return jsonify({'success': True, 'available': product.available})

@app.route('/orders')
@login_required
def orders():
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return render_template('orders.html', orders=orders)

@app.route('/orders/create', methods=['POST'])
@login_required
def create_order():
    data = request.json
    
    # Generate order number
    order_count = Order.query.filter_by(user_id=current_user.id).count()
    order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{order_count + 1:04d}"
    
    # Create order
    order = Order(
        order_number=order_number,
        table_number=data.get('table_number', ''),
        total_amount=float(data['total_amount']),
        user_id=current_user.id
    )
    db.session.add(order)
    db.session.flush()
    
    # Add order items
    for item in data['items']:
        order_item = OrderItem(
            order_id=order.id,
            product_name=item['name'],
            quantity=int(item['quantity']),
            unit_price=float(item['price']),
            subtotal=float(item['subtotal'])
        )
        db.session.add(order_item)
    
    db.session.commit()
    return jsonify({'success': True, 'order_id': order.id, 'order_number': order_number})

@app.route('/orders/<int:order_id>/complete', methods=['POST'])
@login_required
def complete_order(order_id):
    order = Order.query.filter_by(id=order_id, user_id=current_user.id).first_or_404()
    order.status = 'completed'
    db.session.commit()
    return jsonify({'success': True})
