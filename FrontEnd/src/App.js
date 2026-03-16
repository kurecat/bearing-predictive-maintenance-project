import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalStyle from "./pages/GlobalStyle";

import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";

function App() {
  return (
    <>
      <GlobalStyle />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/input1" element={<Report />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;
