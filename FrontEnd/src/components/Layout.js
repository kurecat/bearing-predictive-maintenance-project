import React, { useState, createContext } from "react";
import Navbar from "./Navbar";
import Topbar from "./Topbar";
import styled from "styled-components";

// 1. 알림을 관리할 컨텍스트 생성
export const NotificationContext = createContext();

const Layout = ({ children, toggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalNotifications, setGlobalNotifications] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 알림 추가 함수
  const addNotification = (newAlert) => {
    // 알림 객체에 읽음 여부(isRead) 속성 추가
    setGlobalNotifications((prev) => [{ ...newAlert, isRead: false }, ...prev]);
  };

  // 모든 알림을 읽음 처리하는 함수
  const markAsRead = () => {
    setGlobalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    // 2. 컨텍스트 프로바이더로 감싸서 하위 모든 컴포넌트가 접근 가능하게 함
    <NotificationContext.Provider
      value={{
        notifications: globalNotifications,
        addNotification,
        markAsRead,
      }}
    >
      <Container>
        {isSidebarOpen && <Navbar />}

        <MainWrapper>
          <Topbar toggleSidebar={toggleSidebar} toggleTheme={toggleTheme} />
          <ContentArea>{children}</ContentArea>
        </MainWrapper>
      </Container>
    </NotificationContext.Provider>
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
  background-color: var(--background2);
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
`;
