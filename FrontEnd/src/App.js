import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalStyle from "./styles/GlobalStyle";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import DataHistory from "./pages/DataHistory";
import RealTimeMonitoring from "./pages/RealTimeMonitoring";

function App() {
  return (
    <>
      <GlobalStyle />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<DataHistory />} />
            <Route path="/real-time" element={<RealTimeMonitoring />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;
