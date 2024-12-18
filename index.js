// Importar dependencias
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const ExchangeRate = require('./models/ExchangeRate');

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
const MONGO_URI = process.env.MONGO_URI;

// Verificar si ya existen registros recientes para una moneda
async function isCurrencyRecentlyFetched(currency) {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000); // Hace 6 horas

    const recentRecord = await ExchangeRate.findOne({
      base_currency: currency,
      createdAt: { $gte: sixHoursAgo }
    });

    return !!recentRecord; // Devuelve true si existe un registro reciente
  } catch (error) {
    console.error(`Error al verificar registros recientes para ${currency}:`, error.message);
    return false;
  }
}

async function fetchExchangeRatesForCurrency(baseCurrency) {
  try {
    console.log(`Obteniendo tasas de cambio para ${baseCurrency} desde Exchange Rates API...`);

    const response = await axios.get(`${API_URL}latest`, {
      params: {
        access_key: API_KEY,
        base: baseCurrency
      }
    });

    const rates = response.data.rates;

    console.log(`Datos recibidos de la API para ${baseCurrency}:`, rates);

    const exchangeRate = new ExchangeRate({
      base_currency: baseCurrency,
      rates: rates
    });

    await exchangeRate.save();
    console.log(`Tasas de cambio para ${baseCurrency} guardadas exitosamente en la base de datos.`);
  } catch (error) {
    console.error(`Error al obtener o guardar las tasas de cambio para ${baseCurrency}:`, error.message);
  }
}

async function testCurrency(currency) {
  try {
    const response = await axios.get(`${API_URL}latest`, {
      params: {
        access_key: API_KEY,
        base: currency,
      },
    });
    console.log(`Datos para ${currency}:`, response.data);
  } catch (error) {
    console.error(`Error para ${currency}:`, error.response?.data || error.message);
  }
}

async function main() {
  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(MONGO_URI);
    console.log('Conexión a MongoDB exitosa.');

    const selectedCurrencies = ['USD', 'CAD', 'MXN', 'BRL', 'ARS', 'EUR'];

    for (const currency of selectedCurrencies) {

      await testCurrency(currency);
      return false;
      const recentlyFetched = await isCurrencyRecentlyFetched(currency);

      if (recentlyFetched) {
        console.log(`Se omitió la carga de ${currency} porque ya tiene registros recientes.`);
        continue;
      }

      await fetchExchangeRatesForCurrency(currency);
    }
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}

main();
