import React from "react";
import Navbar from "./Navbar";
import styled from "styled-components";

const Layout = ({ children }) => {
  return (
    <Container>
      <Navbar />
      <ContentArea>{children}</ContentArea>
    </Container>
  );
};

export default Layout;

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  font-family: "Malgun Gothic", sans-serif;
`;

const ContentArea = styled.div`
  flex: 1;
  background-color: #eef2f5;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
`;
