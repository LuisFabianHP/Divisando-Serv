require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const ExchangeRate = require('../models/ExchangeRate');

describe('Pruebas de la API', () => {

  test('Debe devolver monedas disponibles', async () => {
    const response = await request(app)
      .get('/exchange/currencies')
      .set('x-api-key', process.env.API_KEY);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('currencies');
  });

  test('Debe comparar monedas USD y MXN', async () => {
    const response = await request(app)
      .get('/exchange/compare?baseCurrency=USD&targetCurrency=MXN')
      .set('x-api-key', process.env.API_KEY);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('baseCurrency', 'USD');
    expect(response.body).toHaveProperty('targetCurrency', 'MXN');
    expect(response.body).toHaveProperty('status'); // 'up' o 'dw'
  });
  
});