import { z } from 'zod';

// Safety net: every schema has its own Russian messages, but any zod default that slips
// through (an unexpected type, an array instead of a string) is Russian too
z.config(z.locales.ru());

export { z };
