// index.js

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const ExchangeRate = require('./models/ExchangeRate');

const API_KEY = process.env.API_KEY;
const MONGO_URI = process.env.MONGO_URI;

async function getSupportedCurrencies() {
  try {
    console.log('Obteniendo lista de monedas soportadas desde la API...');
    
    const response = await axios.get('https://api.freecurrencyapi.com/v1/currencies', {
      params: {
        apikey: API_KEY
      }
    });

    const currencies = Object.keys(response.data.data);
    console.log('Monedas soportadas:', currencies);
    
    return currencies;
  } catch (error) {
    console.error('Error al obtener las monedas soportadas:', error.message);
    return [];
  }
}

async function fetchExchangeRatesForCurrency(baseCurrency) {
  try {
    console.log(`Obteniendo tasas de cambio para ${baseCurrency} desde la API...`);

    const response = await axios.get('https://api.freecurrencyapi.com/v1/latest', {
      params: {
        apikey: API_KEY,
        base_currency: baseCurrency
      }
    });

    const { data } = response;
    const rates = data.data;

    console.log(`Datos recibidos de la API para ${baseCurrency}:`, rates);

    const exchangeRate = new ExchangeRate({
      base_currency: baseCurrency,
      rates: rates
    });

    //await exchangeRate.save();
    console.log(`Tasas de cambio para ${baseCurrency} guardadas exitosamente en la base de datos.`);
  } catch (error) {
    console.error(`Error al obtener o guardar las tasas de cambio para ${baseCurrency}:`, error.message);
  }
}

async function main() {
  try {
    console.log('Conectando a la base de datos...');
    //await mongoose.connect(MONGO_URI);
    console.log('Conexión a MongoDB exitosa.');

    // Obtener la lista de monedas soportadas
    //const currencies = await getSupportedCurrencies();

    // Lista de monedas seleccionadas
    const selectedCurrencies = ['USD', 'CAD', 'MXN', 'BRL', 'ARS', 'EUR'];

    // Iterar sobre cada moneda y obtener las tasas de cambio
    for (const currency of selectedCurrencies) {
      await fetchExchangeRatesForCurrency(currency);
    }

  } catch (error) {
    console.error('Error al conectar con MongoDB:', error.message);
  } finally {
    //await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}

main();
