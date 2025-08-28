// Test scenarios for cart quantity validation
// This can be used to manually test the implementation

export const testProducts = [
  {
    id: 1,
    name: "Test Product - Out of Stock",
    price: 50000,
    quantity: 0, // Out of stock
    size: "40-42",
    category_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Test Product - Insufficient Stock",
    price: 45000,
    quantity: 30, // Below minimum order (50)
    size: "38-40",
    category_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Test Product - Limited Stock",
    price: 55000,
    quantity: 75, // Less than typical order but above minimum
    size: "42-44",
    category_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    name: "Test Product - Sufficient Stock",
    price: 48000,
    quantity: 200, // Plenty in stock
    size: "36-38",
    category_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Test scenarios to verify:
// 1. Try adding Test Product 1 (out of stock) - should show error
// 2. Try adding Test Product 2 (30 units) - should show insufficient stock error
// 3. Try adding Test Product 3, then try to add 100 more - should limit to 75 total
// 4. Try adding Test Product 4 with normal quantities - should work normally
// 5. Add Product 4 multiple times to test cumulative quantity validation

export const expectedBehaviors = {
  outOfStock: {
    canAddToCart: false,
    errorMessage: "is out of stock",
    uiState: "disabled button with gray overlay"
  },
  insufficientStock: {
    canAddToCart: false,
    errorMessage: "Insufficient stock (30 available, minimum 50 required)",
    uiState: "disabled button with yellow overlay"
  },
  limitedStock: {
    canAddToCart: true,
    behaviorWhenExceeded: "adds maximum possible quantity with warning",
    maxQuantity: 75
  },
  sufficientStock: {
    canAddToCart: true,
    behavior: "normal add to cart functionality"
  }
};
