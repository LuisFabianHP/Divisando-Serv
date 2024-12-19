const axios = require('axios');


/**
 * Realiza una solicitud HTTP a la API de tasas de cambio para obtener las tasas de conversión 
 * de una moneda base específica y las muestra en consola.
 *
 * @param {string} currency - Código de la moneda base (por ejemplo, "USD", "EUR").
 * @param {string} API_URL - URL base de la API de tasas de cambio.
 * @param {string} API_KEY - Clave de acceso para autenticar la solicitud.
 * @returns {Promise<void>} - No retorna ningún valor, imprime los resultados o errores en consola.
 *
 * @example
 * testCurrency('USD', 'https://v6.exchangerate-api.com/v6/', 'YOUR_API_KEY');
 */
async function testCurrency(currency, API_URL, API_KEY) {
  try {
    const response = await axios.get(`${API_URL}${API_KEY}/latest/${currency}`);
    console.log(`Datos para ${currency}:`, response.data.conversion_rates);
  } catch (error) {
    console.error(`Error para ${currency}:`, error.response?.data || error.message);
  }
}

module.exports = { testCurrency };
