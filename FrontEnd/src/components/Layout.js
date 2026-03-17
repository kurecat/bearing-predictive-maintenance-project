import React, { useState, createContext } from "react";
import Navbar from "./Navbar";
import Topbar from "./Topbar";
import styled from "styled-components";

// 컨텍스트 생성
export const NotificationContext = createContext();

const Layout = ({ children, toggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalNotifications, setGlobalNotifications] = useState([]);

  // 실시간 센서 데이터 이력 상태
  const [sensorHistory, setSensorHistory] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 알림 추가 함수
  const addNotification = (newAlert) => {
    setGlobalNotifications((prev) => [{ ...newAlert, isRead: false }, ...prev]);
  };

  // 알림 읽음 처리 함수
  const markAsRead = () => {
    setGlobalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const addSensorRecord = (record) => {
    setSensorHistory((prev) => [record, ...prev].slice(0, 1000));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: globalNotifications,
        addNotification,
        markAsRead,
        sensorHistory,
        addSensorRecord,
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
