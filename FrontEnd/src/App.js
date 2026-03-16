import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalStyle from "./styles/GlobalStyle";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import RealTimeMonitoring from "./pages/RealTimeMonitoring";

function App() {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark(!isDark);
  return (
    <>
      <GlobalStyle />
      <BrowserRouter>
        <Layout toggleTheme={toggleTheme}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report" element={<Report />} />
            <Route path="/real-time" element={<RealTimeMonitoring />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;
