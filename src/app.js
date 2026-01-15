const express = require('express');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const app = express();

app.use(express.json());

//routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes); 

//server starting
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on  ${PORT}. That is great!`);
});



