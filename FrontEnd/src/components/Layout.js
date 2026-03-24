import React, { useState, createContext, useEffect } from "react";
import Navbar from "./Navbar";
import Topbar from "./Topbar";
import styled from "styled-components";
import SocketQueue from "../socket/SocketQueue"; // 소켓 유틸 불러오기

export const NotificationContext = createContext();

const Layout = ({ children, toggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalNotifications, setGlobalNotifications] = useState([]);
  const [sensorHistory, setSensorHistory] = useState([]);

  const socketQueue = new SocketQueue();

  useEffect(() => {
    socketQueue.connect();

    socketQueue.onMessage(() => {
      const rawMessage = socketQueue.getMessage();
      if (!rawMessage) return;

      let parsed;
      try {
        parsed = JSON.parse(rawMessage);
      } catch (e) {
        console.error("Invalid message format:", rawMessage);
        return;
      }
      const device = parsed?.payload?.device;
      const metadata = parsed?.payload?.metadata;
      const rms = parsed?.payload?.rms;
      if (!metadata) return;

      const now = new Date();
      const dateString = now.toISOString().split("T")[0];
      const timeString = now.toLocaleTimeString();

      // === 전역 센서 기록 추가 ===
      addSensorRecord({
        id: metadata.device_ref,
        name: device?.alias ?? device.motor_spec.model, // 노드에서 쓰는 name 포함
        vibration: rms?.[0]
          ? parseFloat(rms[0].toFixed(3))
          : (metadata.vibration ?? 0.0),
        prob: metadata.prob ? parseFloat(metadata.prob.toFixed(2)) : 0,
        label: (metadata.prob ?? 0) >= 80 ? 1 : 0,
        date: dateString,
        time: timeString,
        filename: metadata.filename, // 노드에서 쓰는 filename 포함
      });
    });
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const addNotification = (newAlert) => {
    setGlobalNotifications((prev) => [{ ...newAlert, isRead: false }, ...prev]);
  };

  const markAsRead = () => {
    setGlobalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const addSensorRecord = (record) => {
    setSensorHistory((prev) => {
      const filtered = prev.filter((r) => r.id !== record.id);
      return [record, ...filtered].slice(0, 1000);
    });
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
