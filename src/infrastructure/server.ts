import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3000);

const app = createApp();

app.listen(PORT, () => {
  console.log(`Shopping cart API listening on port ${PORT}`);
});
