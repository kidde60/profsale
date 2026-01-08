# Prof Sale Backend API

A comprehensive business management API designed for Ugandan SMEs, featuring offline-first architecture, inventory management, POS system, and customer relationship management.

## 🚀 Features

### Core Functionality

- **User Authentication** - Phone/Email + Password login without OTP
- **Business Management** - Multi-business support with role-based access
- **Product Management** - Full CRUD with categories, barcode scanning, stock tracking
- **Point of Sale (POS)** - Complete sales processing with inventory updates
- **Customer Management** - Customer profiles, purchase history, loyalty tracking
- **Inventory Control** - Stock movements, low stock alerts, bulk updates
- **Sales Analytics** - Daily reports, trends, product performance
- **Offline Support** - Local sync tracking for mobile apps

### Technical Features

- **MySQL Database** - Optimized schema with proper indexing
- **RESTful API** - Clean, documented endpoints
- **Security** - Helmet, rate limiting, input validation
- **Performance** - Compression, efficient queries, pagination
- **Monitoring** - Comprehensive logging and health checks

## 📋 Prerequisites

- Node.js 18+ and npm 8+
- MySQL 8.0+
- TypeScript knowledge

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd prof-sale-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup MySQL database**

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE prof_sale;"

# Run schema
mysql -u root -p prof_sale < database/schema.sql
```

5. **Start development server**

```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=prof_sale

# Security
JWT_SECRET=your_jwt_secret_key

# Server
PORT=5000
NODE_ENV=development
```

See `.env.example` for all available options.

## 📚 API Documentation

### Authentication Endpoints

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "phone": "+256700123456",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "businessName": "My Shop",
  "businessType": "retail",
  "password": "password123"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "login": "+256700123456", // or email
  "password": "password123"
}
```

### Product Endpoints

#### Get Products

```http
GET /api/products?page=1&limit=20&search=item&category_id=1
Authorization: Bearer <token>
```

#### Create Product

```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "buying_price": 5000,
  "selling_price": 7500,
  "current_stock": 100,
  "min_stock_level": 10,
  "category_id": 1,
  "barcode": "1234567890"
}
```

### Sales Endpoints

#### Create Sale

```http
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_name": "Customer Name",
  "customer_phone": "+256700123456",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 7500
    }
  ],
  "payment_method": "cash",
  "discount_amount": 0,
  "tax_rate": 0.18
}
```

#### Get Sales

```http
GET /api/sales?start_date=2024-01-01&end_date=2024-12-31&page=1&limit=20
Authorization: Bearer <token>
```

### Customer Endpoints

#### Get Customers

```http
GET /api/customers?page=1&limit=20&search=john
Authorization: Bearer <token>
```

#### Create Customer

```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Customer Name",
  "phone": "+256700123456",
  "email": "customer@example.com",
  "customer_type": "regular"
}
```

## 🗄️ Database Schema

### Key Tables

- **users** - User accounts and authentication
- **businesses** - Business profiles and settings
- **employees** - User-business relationships with roles
- **products** - Product catalog with inventory
- **categories** - Product categorization
- **sales** - Sales transactions
- **sale_items** - Individual items in each sale
- **customers** - Customer profiles and loyalty data
- **inventory_movements** - Stock change tracking

### Relationships

- One business owner can have multiple businesses
- Each business can have multiple employees
- Products belong to businesses and categories
- Sales link customers, employees, and products
- Inventory movements track all stock changes

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Using Docker

```bash
npm run docker:build
npm run docker:run
```

## 📊 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run test suite
- `npm run lint` - Check code style
- `npm run format` - Format code with Prettier
- `npm run db:backup` - Backup database

## 🔍 Health Monitoring

### Health Check

```http
GET /health
```

### Logs

- Development: Console output
- Production: Winston file logging in `logs/` directory

## 📝 Development Guidelines

### Code Style

- TypeScript with strict mode
- ESLint + Prettier for formatting
- Consistent error handling
- Input validation on all endpoints

### Security

- JWT authentication
- Rate limiting
- Input sanitization
- CORS configuration
- Helmet security headers

### Performance

- Database indexing
- Query optimization
- Response compression
- Efficient pagination

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Fails**
   - Check MySQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **JWT Errors**
   - Check JWT_SECRET is set
   - Verify token format in requests

3. **Permission Errors**
   - Verify user has business access
   - Check role-based permissions

### Debug Mode

```bash
NODE_ENV=development npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details.

## 🆘 Support

For support, please contact:

- Email: support@profsale.com
- Documentation: [API Docs](https://api.profsale.com/docs)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Prof Sale** - Empowering Ugandan SMEs with digital business management tools.
