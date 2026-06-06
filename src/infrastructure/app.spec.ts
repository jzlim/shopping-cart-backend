import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from './app.js';

describe('Shopping cart API (integration)', () => {
  let app: Express;

  beforeEach(() => {
    // Fresh app per test → fresh in-memory storage, no cross-test bleed.
    app = createApp();
  });

  const session = 's-test';

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET an unknown cart returns an empty cart (not 404)', async () => {
    const res = await request(app).get(`/api/cart/${session}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.itemCount).toBe(0);
  });

  it('POST adds an item and returns 201', async () => {
    const res = await request(app)
      .post(`/api/cart/${session}/items`)
      .send({ productId: 'prod-mouse', quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].productId).toBe('prod-mouse');
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.total.amountInMinorUnits).toBe(5998);
  });

  it('rejects an unknown product with 404', async () => {
    const res = await request(app)
      .post(`/api/cart/${session}/items`)
      .send({ productId: 'does-not-exist', quantity: 1 });
    expect(res.status).toBe(404);
    expect(res.body.error.type).toBe('ProductNotFoundError');
  });

  it('rejects an invalid quantity with 400', async () => {
    const res = await request(app)
      .post(`/api/cart/${session}/items`)
      .send({ productId: 'prod-mouse', quantity: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error.type).toBe('ValidationError');
  });

  it('merges duplicate products on repeated add', async () => {
    await request(app)
      .post(`/api/cart/${session}/items`)
      .send({ productId: 'prod-mouse', quantity: 1 });
    const res = await request(app)
      .post(`/api/cart/${session}/items`)
      .send({ productId: 'prod-mouse', quantity: 2 });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(3);
  });

  it('removes an item via DELETE (itemId === productId)', async () => {
    await request(app)
      .post(`/api/cart/${session}/items`)
      .send({ productId: 'prod-mouse', quantity: 1 });
    const res = await request(app).delete(
      `/api/cart/${session}/items/prod-mouse`,
    );
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('returns 404 removing an absent item', async () => {
    const res = await request(app).delete(
      `/api/cart/${session}/items/prod-mouse`,
    );
    expect(res.status).toBe(404);
    expect(res.body.error.type).toBe('ItemNotFoundError');
  });

  it('checks out a non-empty cart', async () => {
    await request(app)
      .post(`/api/cart/${session}/items`)
      .send({ productId: 'prod-keyboard', quantity: 1 });
    const res = await request(app).post(`/api/cart/${session}/checkout`);
    expect(res.status).toBe(200);
    expect(res.body.total.amountInMinorUnits).toBe(7999);
    expect(res.body.checkedOutAt).toBeDefined();
  });

  it('rejects checkout of an empty cart with 409', async () => {
    const res = await request(app).post(`/api/cart/${session}/checkout`);
    expect(res.status).toBe(409);
    expect(res.body.error.type).toBe('EmptyCartError');
  });

  it('returns 404 for an unknown route', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
  });
});
