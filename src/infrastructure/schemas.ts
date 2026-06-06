import { z } from 'zod';

/**
 * Zod schemas validate input *shape and type* at the HTTP boundary, producing
 * typed objects before any use case runs. The domain re-validates *business
 * rules* through its value-object factories — the two are complementary, not
 * redundant, and together remove every `any` from the request path.
 */

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

export const itemParamsSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  itemId: z.string().min(1, 'itemId is required'),
});

export const addItemBodySchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  quantity: z
    .number({ invalid_type_error: 'quantity must be a number' })
    .int('quantity must be an integer')
    .positive('quantity must be positive'),
});

export type AddItemBody = z.infer<typeof addItemBodySchema>;
