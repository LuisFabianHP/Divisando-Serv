// models/ExchangeRate.js

const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    base_currency: {
      type: String,
      required: true
    },
    rates: {
      type: Map,
      of: Number,
      required: true
    }
  },
  {
    collection: 'exchangeRates', // Especifica el nombre exacto de la colección
    timestamps: true // Agrega campos createdAt y updatedAt automáticamente
  }
);

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);

