import React, { useState } from "react";
import Navbar from "./Navbar";
import Topbar from "./Topbar";
import styled from "styled-components";

const Layout = ({ children, toggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Container>
      {isSidebarOpen && <Navbar />}

      <MainWrapper>
        <Topbar toggleSidebar={toggleSidebar} toggleTheme={toggleTheme} />
        <ContentArea>{children}</ContentArea>
      </MainWrapper>
    </Container>
  );
};

export default Layout;

const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  font-family: "Malgun Gothic", sans-serif;
  overflow: hidden;
`;

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
  min-width: 0;
`;

const ContentArea = styled.div`
  flex: 1;
  background-color: var(--background2); /* 하드코딩된 색상 제거 */
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
`;
