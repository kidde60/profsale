# Customer ID Implementation for Sales

## Overview
This document describes the implementation of customer ID handling for credit sales and customer-attached transactions in the ProfSale system.

## Requirements
- **Credit Sales**: Must always have a customer ID sent from frontend and received by backend
- **Customer-Attached Sales**: All sales linked to customers must include customer_id
- **Walk-in Customers**: Sales without a customer ID (walk-in customers) cannot use credit payment method

## Implementation Details

### Frontend (CheckoutScreen.tsx)

#### Customer Type Selection
The checkout screen supports three customer types:
1. **existing** - Select from existing customers
2. **walkin** - Walk-in customer (no customer ID)
3. **new** - Create a new customer during checkout

#### Validation Logic
```typescript
// For credit sales, customer is mandatory
if (paymentMethod === 'credit') {
  if (customerType === 'existing' && !selectedCustomer) {
    handleWarning('Credit sales must be linked to a customer');
    return;
  }
  if (customerType === 'new' && !customerName.trim()) {
    handleWarning('Please enter customer name for credit sales');
    return;
  }
}

// For customer-attached sales (non-walkin), customer must be selected
if (customerType === 'existing' && !selectedCustomer) {
  handleWarning('Please select a customer');
  return;
}
```

#### Customer ID Assignment
```typescript
let customerId = selectedCustomer?.id || null;

// For new customers, create them first and get their ID
if (customerType === 'new' && customerName.trim()) {
  const newCustomer = await customerService.createCustomer({
    name: customerName.trim(),
    phone: customerPhone.trim() || undefined,
    email: undefined,
    address: undefined,
    business_id: user?.businessId || 1,
  });
  customerId = newCustomer.id;
}

// Ensure credit sales have customer_id
if (paymentMethod === 'credit' && !customerId) {
  handleWarning('Credit sales must be linked to a customer');
  return;
}
```

#### API Request
The frontend sends the sale data with `customer_id`:
```typescript
await salesService.createSale({
  businessId: user?.businessId || 1,
  customer_id: customerId || undefined,  // Sent to backend
  customerName: ...,
  customerPhone: ...,
  items: [...],
  paymentMethod,
  total: calculateTotal(),
  discountAmount: parseFloat(discountAmount) || 0,
  amountPaid: ...,
});
```

### Backend (sales.routes.ts)

#### Request Validation
The backend validates incoming sale requests:

```typescript
const {
  customerId,
  customer_id,  // Accept both camelCase and snake_case
  customerName,
  customerPhone,
  items,
  paymentMethod = 'cash',
  // ... other fields
} = req.body;

// Use customer_id if provided (snake_case from frontend), fallback to customerId
const finalCustomerId = customer_id || customerId;

// Validate credit sales must have a customer
if (paymentMethod === 'credit' && !finalCustomerId) {
  res.status(400).json({
    success: false,
    message: 'Credit sales must be linked to a customer. Customer ID is required.',
  });
  return;
}
```

#### Database Storage
The validated customer ID is stored in the sales table:
```typescript
const [saleResult] = await connection.execute<any>(
  `INSERT INTO sales 
  (business_id, employee_id, customer_id, sale_number, customer_name, customer_phone,
   subtotal, tax_amount, discount_amount, total_amount, amount_paid, change_amount,
   payment_method, payment_reference, status, notes) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    businessId,
    employeeId,
    finalCustomerId || null,  // Store validated customer_id
    saleNumber,
    customerName || null,
    customerPhone || null,
    // ... other values
  ],
);
```

#### Customer Totals Update
When a customer is linked to a sale, their totals are updated:
```typescript
if (finalCustomerId) {
  await connection.execute(
    `UPDATE customers 
    SET total_purchases = total_purchases + ?, 
        total_orders = total_orders + 1,
        last_purchase_date = CURRENT_TIMESTAMP 
    WHERE id = ? AND business_id = ?`,
    [totalAmount, finalCustomerId, businessId],
  );
}
```

## Database Schema

### Sales Table
```sql
CREATE TABLE sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  employee_id INT NOT NULL,
  customer_id INT,  -- NULL for walk-in customers
  sale_number VARCHAR(50) UNIQUE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  subtotal DECIMAL(12, 2),
  tax_amount DECIMAL(12, 2),
  discount_amount DECIMAL(12, 2),
  total_amount DECIMAL(12, 2),
  amount_paid DECIMAL(12, 2),
  change_amount DECIMAL(12, 2),
  payment_method ENUM('cash', 'mobile_money', 'card', 'credit'),
  payment_reference VARCHAR(255),
  status ENUM('completed', 'pending', 'refunded', 'cancelled'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (employee_id) REFERENCES users(id)
);
```

## Flow Diagrams

### Credit Sale Flow
```
User selects "Credit" payment method
    ↓
Frontend validates customer selection
    ↓
If existing customer: Use selected customer ID
If new customer: Create customer and get ID
If walk-in: Show error (not allowed for credit)
    ↓
Frontend sends customer_id to backend
    ↓
Backend validates customer_id is present
    ↓
Backend creates sale with customer_id
    ↓
Backend updates customer totals
    ↓
Sale created successfully
```

### Customer-Attached Sale Flow
```
User selects customer type "existing"
    ↓
Frontend requires customer selection
    ↓
User selects customer from dropdown
    ↓
Frontend sends customer_id to backend
    ↓
Backend stores customer_id in sales table
    ↓
Backend updates customer totals
    ↓
Sale created successfully
```

### Walk-in Sale Flow
```
User selects customer type "walkin"
    ↓
Frontend allows any payment method except credit
    ↓
Frontend sends customer_id as null/undefined
    ↓
Backend accepts sale without customer_id
    ↓
Backend does not update any customer totals
    ↓
Sale created successfully (walk-in)
```

## Error Handling

### Frontend Validation Errors
- "Credit sales must be linked to a customer" - When credit payment is selected without a customer
- "Please enter customer name for credit sales" - When creating new customer for credit sale without name
- "Please select a customer" - When customer type is "existing" but no customer selected

### Backend Validation Errors
- "Credit sales must be linked to a customer. Customer ID is required." - When credit sale is submitted without customer_id

## Testing Checklist

- [ ] Credit sale with existing customer - customer_id should be sent and stored
- [ ] Credit sale with new customer - customer created and customer_id stored
- [ ] Credit sale with walk-in customer - should show error
- [ ] Cash sale with existing customer - customer_id should be sent and stored
- [ ] Cash sale with walk-in customer - customer_id should be null
- [ ] Mobile money sale with existing customer - customer_id should be sent and stored
- [ ] Card sale with existing customer - customer_id should be sent and stored
- [ ] Customer totals updated correctly for linked sales
- [ ] Walk-in sales don't affect customer totals

## API Endpoints

### Create Sale
**POST** `/api/sales`

**Request Body:**
```json
{
  "businessId": 1,
  "customer_id": 5,  // Required for credit sales
  "customerName": "John Doe",
  "customerPhone": "0712345678",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 1000
    }
  ],
  "paymentMethod": "credit",
  "total": 2000,
  "discountAmount": 0,
  "amountPaid": 500
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Sale completed successfully",
  "data": {
    "sale": {
      "id": 123,
      "sale_number": "PS120240515143022",
      "customer_id": 5,
      "total_amount": 2000,
      "amount_paid": 500,
      "payment_method": "credit",
      "status": "pending",
      "items": [...]
    }
  }
}
```

**Response (Error - Missing customer_id for credit sale):**
```json
{
  "success": false,
  "message": "Credit sales must be linked to a customer. Customer ID is required."
}
```

## Related Files
- Frontend: `/src/screens/CheckoutScreen.tsx`
- Backend: `/backend/src/routes/sales.routes.ts`
- Service: `/src/services/salesService.ts`
- Types: `/src/types/index.ts`
