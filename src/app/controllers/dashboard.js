const express = require('express'),
      router = express.Router(),
      fs = require('fs'),
      path = require('path'),
      models = require('../models');

let config, db, machines;

router.get('/', (req, res, next) => {
  dashboard.title = 'Dashboard :: Big Picture Studio CRMS';
  res.render('dashboard', dashboard);
});

module.exports = app => {
  app.use('/dashboard', router);
};

