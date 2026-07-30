import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Layout } from "./components/Layout.tsx";
import { Overview } from "./pages/Overview.tsx";
import { Requirements } from "./pages/Requirements.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
