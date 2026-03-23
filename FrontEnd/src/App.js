import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalStyle from "./styles/GlobalStyle";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import DataHistory from "./pages/DataHistory";

import PredictiveAnalysis from "./pages/PredictiveAnalysis";

function App() {
  return (
    <>
      <GlobalStyle />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<DataHistory />} />

            <Route path="/analysis" element={<PredictiveAnalysis />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;
