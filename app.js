const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./swagger.json');
const usersRouter = require('./routes/api/auth');
const mainRouter = require('./routes/api/mainPage');
const ingredientsRouter = require('./routes/api/ingredients');
const recipesRouter = require('./routes/api/recipes');
const ownRecipesRouter = require('./routes/api/ownRecipes');
const favoriteRouter = require('./routes/api/favorite');
const shoppingListRouter = require('./routes/api/shoppingList');

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(
  logger('common', {
    stream: fs.createWriteStream('./public/server.log', { flags: 'a' }),
  })
);
app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public')); //allows to get static files from /public folder
app.set('view engine', 'ejs'); // sets EJS as the view engine for the Express application

app.use('/', mainRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/auth', usersRouter);
app.use('/recipes', recipesRouter);
app.use('/ingredients', ingredientsRouter);
app.use('/own-recipes', ownRecipesRouter);
app.use('/favorite', favoriteRouter);
app.use('/shopping-list', shoppingListRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// catching mongoose cast error
app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
    return res.status(404).send(err.message);
  }
  next(err);
});

// catching mongoose validation error
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    let errors = {};
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });
    return res.status(400).send(errors);
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.log(err);
  const { status = 500, message = 'Server error' } = err;
  res.status(status).json({ message });
});

module.exports = app;
