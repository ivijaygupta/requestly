import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routesV2 } from "routes";
import * as Sentry from "@sentry/react";

import AgentationWrapper from "DES-ai-components/Agentation/AgentationWrapper";

declare global {
  namespace globalThis {
    var globalUnhandledRejectionHandlers: Set<(event: PromiseRejectionEvent) => void>;
  }
}

/** Common things which do not depend on routes for App **/
const App = () => {
  const router = Sentry.wrapCreateBrowserRouter(createBrowserRouter)(routesV2);

  return (
    <>
      <RouterProvider router={router} />
      <AgentationWrapper />
    </>
  );
};

export default App;
