import React, { useState, createContext, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import Topbar from "./Topbar";
import styled, { keyframes } from "styled-components";
import SocketQueue from "../socket/SocketQueue";

export const NotificationContext = createContext();

const Layout = ({ children, toggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalNotifications, setGlobalNotifications] = useState([]);
  const [sensorHistory, setSensorHistory] = useState([]);

  const [popups, setPopups] = useState([]);

  const socketQueue = useMemo(() => new SocketQueue(), []);

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

      const record = {
        id: metadata.device_ref,
        name: device?.alias ?? device.motor_spec.model,
        vibration: rms?.[0]
          ? parseFloat(rms[0].toFixed(3))
          : (metadata.vibration ?? 0.0),
        prob: metadata.prob ? parseFloat((metadata.prob * 100).toFixed(0)) : 0,
        label: (metadata.prob ?? 0) >= 80 ? 1 : 0,
        date: dateString,
        time: timeString,
        filename: metadata.filename,
      };

      // === 전역 센서 기록 추가 ===
      addSensorRecord(record);

      // === 경고 알림 추가 ===
      if (record.prob >= 70) {
        const msg = `[고장] ${record.name} 모터 고장 확률 ${record.prob}%`;
        addNotification({
          type: "danger",
          message: msg,
          timestamp: `${record.date} ${record.time}`,
        });
        showPopup(msg, "danger"); // 팝업 띄우기
      } else if (record.prob >= 30) {
        const msg = `[위험] ${record.name} 모터 이상 징후 (확률 ${record.prob}%)`;
        addNotification({
          type: "warning",
          message: msg,
          timestamp: `${record.date} ${record.time}`,
        });
        showPopup(msg, "warning"); // 팝업 띄우기
      }
    });

    return () => {
      if (socketQueue && typeof socketQueue.disconnect === "function") {
        socketQueue.disconnect();
      }
    };
  }, [socketQueue]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const addNotification = (newAlert) => {
    setGlobalNotifications((prev) => [
      { id: prev.length + 1, ...newAlert, isRead: false },
      ...prev,
    ]);
  };

  const removeNotification = (id) => {
    setGlobalNotifications((prev) => prev.filter((n) => n.id !== id));
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

  const showPopup = (message, type) => {
    const id = Date.now() + Math.random();
    setPopups((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 4000);
  };

  const removePopup = (id) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  };
  return (
    <NotificationContext.Provider
      value={{
        notifications: globalNotifications,
        addNotification,
        markAsRead,
        removeNotification,
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

        <PopupContainer>
          {popups.map((popup) => (
            <PopupBox key={popup.id} $type={popup.type}>
              <PopupIcon>{popup.type === "danger" ? "🚨" : "⚠️"}</PopupIcon>
              <PopupMessage>
                <PopupPrefix $type={popup.type}>
                  {popup.type === "danger" ? "[고장]" : "[위험]"}
                </PopupPrefix>{" "}
                {popup.message.replace(/^\[(고장|위험)\]\s*/, "")}
              </PopupMessage>
              <PopupClose onClick={() => removePopup(popup.id)}>✕</PopupClose>
            </PopupBox>
          ))}
        </PopupContainer>
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
  position: relative;
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

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const PopupContainer = styled.div`
  position: absolute;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 9999;
`;

const PopupBox = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  animation: ${slideIn} 0.4s ease-out forwards;
  min-width: 250px;
  max-width: 350px;
`;

const PopupMessage = styled.div`
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: var(--font);
  line-height: 1.4;
`;

const PopupPrefix = styled.span`
  color: ${(props) =>
    props.$type === "danger" ? "var(--error)" : "var(--waiting)"};
`;

const PopupIcon = styled.span`
  font-size: 20px;
`;

const PopupClose = styled.button`
  background: none;
  border: none;
  color: var(--font2);
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  margin-left: 10px;

  &:hover {
    color: var(--error);
  }
`;
