const express = require('express');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory data store
let menuItems = [
    {
        id: 1,
        name: "Classic Burger",
        description: "Beef patty with lettuce, tomato, and cheese on a sesame seed bun",
        price: 12.99,
        category: "entree",
        ingredients: ["beef", "lettuce", "tomato", "cheese", "bun"],
        available: true
    },
    {
        id: 2,
        name: "Caesar Salad",
        description: "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese",
        price: 9.99,
        category: "appetizer",
        ingredients: ["romaine lettuce", "caesar dressing", "croutons", "parmesan cheese"],
        available: true
    },
    {
        id: 3,
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with a molten chocolate center, served with vanilla ice cream",
        price: 7.99,
        category: "dessert",
        ingredients: ["chocolate", "flour", "eggs", "sugar", "butter", "vanilla ice cream"],
        available: true
    }
];

let nextId = 4;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    
    console.log(`[${timestamp}] ${method} ${url}`);
    
    if ((method === 'POST' || method === 'PUT') && req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    
    next();
});

// Validation rules for menu items
const menuItemValidationRules = () => {
    return [
        body('name')
            .notEmpty().withMessage('Name is required')
            .isString().withMessage('Name must be a string')
            .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
        
        body('description')
            .notEmpty().withMessage('Description is required')
            .isString().withMessage('Description must be a string')
            .isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
        
        body('price')
            .notEmpty().withMessage('Price is required')
            .isNumeric().withMessage('Price must be a number')
            .custom(value => value > 0).withMessage('Price must be greater than 0'),
        
        body('category')
            .notEmpty().withMessage('Category is required')
            .isString().withMessage('Category must be a string')
            .isIn(['appetizer', 'entree', 'dessert', 'beverage'])
            .withMessage('Category must be one of: appetizer, entree, dessert, beverage'),
        
        body('ingredients')
            .notEmpty().withMessage('Ingredients are required')
            .isArray({ min: 1 }).withMessage('Ingredients must be an array with at least 1 item')
            .custom(ingredients => {
                return ingredients.every(ing => typeof ing === 'string' && ing.trim().length > 0);
            }).withMessage('Each ingredient must be a non-empty string'),
        
        body('available')
            .optional()
            .isBoolean().withMessage('Available must be a boolean')
    ];
};

// Validation result handler
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    const extractedErrors = errors.array().map(err => ({
        field: err.path,
        message: err.msg
    }));
    
    // 400 Bad Request for validation errors
    return res.status(400).json({
        error: 'Validation failed',
        details: extractedErrors
    });
};

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Tasty Bites API',
        endpoints: {
            'GET /api/menu': 'Get all menu items',
            'GET /api/menu/:id': 'Get a specific menu item',
            'POST /api/menu': 'Add a new menu item',
            'PUT /api/menu/:id': 'Update a menu item',
            'DELETE /api/menu/:id': 'Delete a menu item'
        }
    });
});

// GET /api/menu - Retrieve all menu items
app.get('/api/menu', (req, res) => {
    // 200 OK for successful GET
    res.status(200).json({
        count: menuItems.length,
        items: menuItems
    });
});

// GET /api/menu/:id - Retrieve a specific menu item
app.get('/api/menu/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const menuItem = menuItems.find(item => item.id === id);
    
    if (!menuItem) {
        // 404 Not Found
        return res.status(404).json({ 
            error: 'Menu item not found',
            message: `No menu item exists with id ${id}`
        });
    }
    
    // 200 OK for successful GET
    res.status(200).json(menuItem);
});

// POST /api/menu - Add a new menu item (with validation)
app.post('/api/menu', menuItemValidationRules(), validate, (req, res) => {
    const newMenuItem = {
        id: nextId++,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        ingredients: req.body.ingredients,
        available: req.body.available !== undefined ? req.body.available : true
    };
    
    menuItems.push(newMenuItem);
    
    // 201 Created for successful POST
    res.status(201).json({
        message: 'Menu item created successfully',
        item: newMenuItem
    });
});

// PUT /api/menu/:id - Update an existing menu item (with validation)
app.put('/api/menu/:id', menuItemValidationRules(), validate, (req, res) => {
    const id = parseInt(req.params.id);
    const index = menuItems.findIndex(item => item.id === id);
    
    if (index === -1) {
        // 404 Not Found
        return res.status(404).json({
            error: 'Menu item not found',
            message: `No menu item exists with id ${id}`
        });
    }
    
    const updatedMenuItem = {
        ...menuItems[index],
        ...req.body,
        id: id, // Ensure ID doesn't change
        available: req.body.available !== undefined ? req.body.available : menuItems[index].available
    };
    
    menuItems[index] = updatedMenuItem;
    
    // 200 OK for successful PUT
    res.status(200).json({
        message: 'Menu item updated successfully',
        item: updatedMenuItem
    });
});

// DELETE /api/menu/:id - Remove a menu item
app.delete('/api/menu/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = menuItems.findIndex(item => item.id === id);
    
    if (index === -1) {
        // 404 Not Found
        return res.status(404).json({
            error: 'Menu item not found',
            message: `No menu item exists with id ${id}`
        });
    }
    
    const deletedItem = menuItems[index];
    menuItems.splice(index, 1);
    
    // 200 OK for successful DELETE
    res.status(200).json({
        message: 'Menu item deleted successfully',
        item: deletedItem
    });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    // 500 Internal Server Error
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong on the server'
    });
});

app.listen(PORT, () => {
    console.log(`Tasty Bites API server running at http://localhost:${PORT}`);
}); 