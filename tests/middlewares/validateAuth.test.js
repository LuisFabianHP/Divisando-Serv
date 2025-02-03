const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const  generateJWT = require('../../utils/generateJWT');
const { generateRefreshToken } = require('../../utils/refreshToken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

let accessToken, refreshToken;
let mongoServer;

beforeAll(async () => {
    jest.setTimeout(15000); // Aumenta el tiempo de espera para que MongoMemoryServer inicie
    // Inicia la base de datos en memoria
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    
    // Limpiar la colección de usuarios (por si acaso)
    await User.deleteMany({});

    // Crear un usuario de prueba
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        provider: 'local',
        refreshToken: '' // Inicialmente vacío
    });

    // Generar tokens de prueba
    accessToken = generateJWT(user.id, user.role);
    refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();
});

describe('Autenticación y manejo de tokens', () => {
    test('Debe rechazar acceso sin token', async () => {
        const res = await request(app).get('/exchange/currencies');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Acceso denegado. Token no proporcionado.');
    });

    test('Debe permitir acceso con un JWT válido', async () => {
        const res = await request(app)
            .get('/exchange/currencies')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
    });

    test('Debe rechazar un token inválido', async () => {
        const res = await request(app)
            .get('/exchange/currencies')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Token inválido o expirado.');
    });

    test('Debe renovar el Access Token con un Refresh Token válido', async () => {
        const res = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
    });

    test('Debe rechazar un Refresh Token inválido', async () => {
        const res = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken: 'invalidtoken' });
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Refresh Token inválido.');
    });

    test('Debe eliminar el Refresh Token al hacer logout', async () => {
        await request(app).post('/auth/logout').send({ refreshToken });
        const user = await User.findOne({ username: 'testuser' });
        expect(user.refreshToken).toBeFalsy();
    });
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});
