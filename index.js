// Importar dependencias
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const ExchangeRate = require('./models/ExchangeRate');
//const testUtils = require('./tests/testUtils');

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
const MONGO_URI = process.env.MONGO_URI;

/**
 * Verifica si una moneda tiene registros recientes (dentro de las últimas 6 horas) en la base de datos.
 *
 * @param {string} currency - Código de la moneda (por ejemplo, "USD", "EUR") a verificar.
 * @returns {Promise<boolean>} - Devuelve `true` si existe un registro reciente, o `false` en caso contrario o si ocurre un error.
 *
 * @description
 * - Consulta la base de datos MongoDB para buscar registros de la colección `ExchangeRate` 
 *   donde la moneda base sea la indicada y el registro sea más reciente que 6 horas.
 * - Utiliza la fecha actual menos 6 horas como referencia para determinar la "recencia".
 * - En caso de error, captura el problema y lo registra en la consola.
 *
 * @example
 * const recentlyFetched = await isCurrencyRecentlyFetched('USD');
 * if (recentlyFetched) {
 *   console.log('La moneda USD ya tiene registros recientes.');
 * } else {
 *   console.log('No hay registros recientes para USD. Procediendo a cargar datos...');
 * }
 */
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

/**
 * Obtiene las tasas de cambio de una moneda base desde la API ExchangeRate-API 
 * y guarda los resultados en la base de datos MongoDB.
 *
 * @param {string} baseCurrency - Código de la moneda base para la cual se obtendrán las tasas de cambio (por ejemplo, "USD", "EUR").
 * @returns {Promise<void>} - No retorna ningún valor, guarda los datos en la base de datos y muestra mensajes en consola.
 *
 * @description
 * - Realiza una solicitud HTTP GET a la API de ExchangeRate-API utilizando la moneda base proporcionada.
 * - Extrae las tasas de conversión de la respuesta y las guarda en un modelo `ExchangeRate` en MongoDB.
 * - Maneja errores de manera robusta, mostrando mensajes descriptivos en consola en caso de fallo.
 *
 * @example
 * await fetchExchangeRatesForCurrency('USD');
 * // Salida en consola:
 * // Obteniendo tasas de cambio para USD desde ExchangeRate-API...
 * // Datos recibidos de la API para USD: { EUR: 0.85, GBP: 0.75, ... }
 * // Tasas de cambio para USD guardadas exitosamente en la base de datos.
 */
async function fetchExchangeRatesForCurrency(baseCurrency) {
  try {
    console.log(`Obteniendo tasas de cambio para ${baseCurrency} desde ExchangeRate-API...`);

    const response = await axios.get(`${API_URL}${API_KEY}/latest/${baseCurrency}`);

    const rates = response.data.conversion_rates;

    console.log(`Datos recibidos de la API para ${baseCurrency}:`, rates);

    const exchangeRate = new ExchangeRate({
      base_currency: baseCurrency,
      rates: rates
    });

    await exchangeRate.save();
    console.log(`Tasas de cambio para ${baseCurrency} guardadas exitosamente en la base de datos.`);
  } catch (error) {
    console.error(`Error al obtener o guardar las tasas de cambio para ${baseCurrency}:`, error.response?.data || error.message);
  }
}

async function main() {
  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(MONGO_URI);
    console.log('Conexión a MongoDB exitosa.');

    const selectedCurrencies = ['USD', 'CAD', 'MXN', 'BRL', 'ARS', 'EUR'];

    for (const currency of selectedCurrencies) {
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
