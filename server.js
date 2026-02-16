const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory data store (in a real app, this would be a database)
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
    
    // Log basic request info
    console.log(`[${timestamp}] ${method} ${url}`);
    
    // Log body for POST and PUT requests
    if ((method === 'POST' || method === 'PUT') && req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    
    next();
});

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
        return res.status(404).json({ 
            error: 'Menu item not found',
            message: `No menu item exists with id ${id}`
        });
    }
    
    res.status(200).json(menuItem);
});

// Validation function for menu items
const validateMenuItem = (data, isUpdate = false) => {
    const errors = [];
    
    // Name validation
    if (!isUpdate || (isUpdate && data.name !== undefined)) {
        if (!data.name) {
            errors.push({ field: 'name', message: 'Name is required' });
        } else if (typeof data.name !== 'string') {
            errors.push({ field: 'name', message: 'Name must be a string' });
        } else if (data.name.length < 3) {
            errors.push({ field: 'name', message: 'Name must be at least 3 characters long' });
        }
    }
    
    // Description validation
    if (!isUpdate || (isUpdate && data.description !== undefined)) {
        if (!data.description) {
            errors.push({ field: 'description', message: 'Description is required' });
        } else if (typeof data.description !== 'string') {
            errors.push({ field: 'description', message: 'Description must be a string' });
        } else if (data.description.length < 10) {
            errors.push({ field: 'description', message: 'Description must be at least 10 characters long' });
        }
    }
    
    // Price validation
    if (!isUpdate || (isUpdate && data.price !== undefined)) {
        if (data.price === undefined || data.price === null) {
            errors.push({ field: 'price', message: 'Price is required' });
        } else if (typeof data.price !== 'number') {
            errors.push({ field: 'price', message: 'Price must be a number' });
        } else if (data.price <= 0) {
            errors.push({ field: 'price', message: 'Price must be greater than 0' });
        }
    }
    
    // Category validation
    if (!isUpdate || (isUpdate && data.category !== undefined)) {
        const validCategories = ['appetizer', 'entree', 'dessert', 'beverage'];
        if (!data.category) {
            errors.push({ field: 'category', message: 'Category is required' });
        } else if (typeof data.category !== 'string') {
            errors.push({ field: 'category', message: 'Category must be a string' });
        } else if (!validCategories.includes(data.category)) {
            errors.push({ field: 'category', message: 'Category must be one of: appetizer, entree, dessert, beverage' });
        }
    }
    
    // Ingredients validation
    if (!isUpdate || (isUpdate && data.ingredients !== undefined)) {
        if (!data.ingredients) {
            errors.push({ field: 'ingredients', message: 'Ingredients are required' });
        } else if (!Array.isArray(data.ingredients)) {
            errors.push({ field: 'ingredients', message: 'Ingredients must be an array' });
        } else if (data.ingredients.length < 1) {
            errors.push({ field: 'ingredients', message: 'Ingredients must have at least 1 item' });
        } else {
            const invalidIngredients = data.ingredients.some(ing => typeof ing !== 'string' || ing.trim().length === 0);
            if (invalidIngredients) {
                errors.push({ field: 'ingredients', message: 'Each ingredient must be a non-empty string' });
            }
        }
    }
    
    // Available validation (optional)
    if (data.available !== undefined && typeof data.available !== 'boolean') {
        errors.push({ field: 'available', message: 'Available must be a boolean' });
    }
    
    return errors;
};

// POST /api/menu - Add a new menu item
app.post('/api/menu', (req, res) => {
    const errors = validateMenuItem(req.body);
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }
    
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
    
    res.status(201).json({
        message: 'Menu item created successfully',
        item: newMenuItem
    });
});

// PUT /api/menu/:id - Update an existing menu item
app.put('/api/menu/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = menuItems.findIndex(item => item.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            error: 'Menu item not found',
            message: `No menu item exists with id ${id}`
        });
    }
    
    const errors = validateMenuItem(req.body, true);
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }
    
    const updatedMenuItem = {
        ...menuItems[index],
        ...req.body,
        id: id // Ensure ID doesn't change
    };
    
    menuItems[index] = updatedMenuItem;
    
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
        return res.status(404).json({
            error: 'Menu item not found',
            message: `No menu item exists with id ${id}`
        });
    }
    
    const deletedItem = menuItems[index];
    menuItems.splice(index, 1);
    
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
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong on the server'
    });
});

app.listen(PORT, () => {
    console.log(`Tasty Bites API server running at http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  /');
    console.log('  GET  /api/menu');
    console.log('  GET  /api/menu/:id');
    console.log('  POST /api/menu');
    console.log('  PUT  /api/menu/:id');
    console.log('  DEL  /api/menu/:id');
});