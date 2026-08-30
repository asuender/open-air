import { LocationProvider, Route, Router } from "preact-iso";

import { Layout } from "./components/Layout.tsx";
import { Overview } from "./pages/Overview.tsx";
import { Requirements } from "./pages/Requirements.tsx";

export default function App() {
  return (
    <LocationProvider>
      <Layout>
        <Router>
          <Route path="/" component={Overview} />
          <Route path="/requirements" component={Requirements} />
          <Route default component={Overview} />
        </Router>
      </Layout>
    </LocationProvider>
  );
}
