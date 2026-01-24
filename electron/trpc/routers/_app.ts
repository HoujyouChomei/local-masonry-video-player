// electron/trpc/routers/_app.ts

import { router } from '../init';
import { mediaRouter } from './media';
import { collectionRouter } from './collection';
import { systemRouter } from './system';
import { subscriptionRouter } from './subscription';

export const appRouter = router({
  media: mediaRouter,
  collection: collectionRouter,
  system: systemRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
