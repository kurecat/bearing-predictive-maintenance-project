import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { NotificationContext } from "./Layout"; // 경로 주의

export default function Topbar({ toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Context에서 데이터 가져오기
  const { notifications, markAsRead } = useContext(NotificationContext);

  const [tabs, setTabs] = useState([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const alertRef = useRef(null);

  // 읽지 않은 알림 개수
  const unreadCount = notifications
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  const getTabLabel = (path) => {
    if (path.includes("/history")) return "데이터 예측 및 이력";
    if (path.includes("/real-time")) return "실시간 모니터링";
    return "대시보드";
  };

  useEffect(() => {
    const currentPath = location.pathname;
    setTabs((prevTabs) => {
      const isExist = prevTabs.find((tab) => tab.path === currentPath);
      if (!isExist) {
        return [
          ...prevTabs,
          {
            path: currentPath,
            label: getTabLabel(currentPath),
            isFavorite: false,
          },
        ];
      }
      return prevTabs;
    });
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (alertRef.current && !alertRef.current.contains(event.target))
        setIsAlertOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // [수정] 알림창 열 때 markAsRead가 존재할 때만 실행하도록 방어
  const handleToggleAlert = () => {
    if (!isAlertOpen && markAsRead) {
      markAsRead();
    }
    setIsAlertOpen(!isAlertOpen);
  };

  const isCurrentFavorite =
    tabs.find((t) => t.path === location.pathname)?.isFavorite || false;

  const toggleFavorite = () => {
    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) =>
        tab.path === location.pathname
          ? { ...tab, isFavorite: !tab.isFavorite }
          : tab,
      );
      return updatedTabs.sort(
        (a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0),
      );
    });
  };

  const handleTabClick = (path) => navigate(path);

  const handleCloseTab = (e, pathToClose) => {
    e.stopPropagation();
    const targetTab = tabs.find((t) => t.path === pathToClose);
    if (targetTab?.isFavorite) return;
    const newTabs = tabs.filter((tab) => tab.path !== pathToClose);
    setTabs(newTabs);
    if (location.pathname === pathToClose) {
      if (newTabs.length > 0) navigate(newTabs[newTabs.length - 1].path);
      else navigate("/");
    }
  };

  return (
    <Container>
      <LeftSection>
        <IconButton onClick={toggleSidebar} title="사이드바 열기/닫기">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
        </IconButton>

        <IconButton onClick={toggleFavorite} title="현재 탭 고정/해제">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isCurrentFavorite ? "#facc15" : "none"}
            stroke={isCurrentFavorite ? "#facc15" : "currentColor"}
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </IconButton>

        <TabContainer>
          {tabs.map((tab) => (
            <TabItem
              key={tab.path}
              $isActive={location.pathname === tab.path}
              onClick={() => handleTabClick(tab.path)}
            >
              {tab.isFavorite && <TabStar>★</TabStar>}
              {tab.label}
              {!tab.isFavorite && (
                <CloseButton
                  className="close-btn"
                  onClick={(e) => handleCloseTab(e, tab.path)}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </CloseButton>
              )}
            </TabItem>
          ))}
        </TabContainer>
      </LeftSection>

      <RightSection>
        <AlertWrapper ref={alertRef}>
          <IconButton onClick={handleToggleAlert} title="알림">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && <BadgeCount>{unreadCount}</BadgeCount>}
          </IconButton>
          {isAlertOpen && (
            <Dropdown>
              <DropdownHeader>
                최근 알림 ({notifications.length})
              </DropdownHeader>
              <DropdownBody>
                {notifications.length === 0 ? (
                  <EmptyMsg>알림이 없습니다.</EmptyMsg>
                ) : (
                  notifications.map((n) => (
                    <NotificationItem key={n.id}>
                      <p>{n.message}</p>
                      <span>{n.time}</span>
                    </NotificationItem>
                  ))
                )}
              </DropdownBody>
            </Dropdown>
          )}
        </AlertWrapper>
      </RightSection>
    </Container>
  );
}

// --- 디자인 원본 100% 동일 유지 ---
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 24px;
  background-color: var(--background);
  border-bottom: 1px solid var(--border);
  width: 100%;
  box-sizing: border-box;
`;
const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  overflow: hidden;
`;
const IconButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--font2);
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  &:hover {
    background-color: var(--background2);
    color: var(--font);
  }
`;
const TabContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  overflow-x: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`;
const TabItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: var(--fontMd);
  font-weight: ${(props) =>
    props.$isActive ? "var(--bold)" : "var(--medium)"};
  color: ${(props) => (props.$isActive ? "var(--main)" : "var(--font2)")};
  background-color: ${(props) => (props.$isActive ? "#eff6ff" : "transparent")};
  border: 1px solid ${(props) => (props.$isActive ? "#bfdbfe" : "transparent")};
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    .close-btn {
      opacity: 1;
    }
  }
`;
const TabStar = styled.span`
  margin-right: 6px;
  color: #facc15;
`;
const CloseButton = styled.span`
  margin-left: 6px;
  display: flex;
  align-items: center;
  opacity: 0;
  &:hover {
    color: var(--error);
  }
`;
const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const AlertWrapper = styled.div`
  position: relative;
`;
const BadgeCount = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--error);
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 10px;
  border: 2px solid var(--background);
`;
const Dropdown = styled.div`
  position: absolute;
  top: 45px;
  right: 0;
  width: 280px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
  z-index: 1000;
  overflow: hidden;
`;
const DropdownHeader = styled.div`
  padding: 12px 16px;
  background: var(--background2);
  font-weight: bold;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
`;
const DropdownBody = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;
const NotificationItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  p {
    margin: 0;
    font-size: 12px;
    color: var(--font);
  }
  span {
    font-size: 10px;
    color: var(--font2);
  }
  &:hover {
    background: var(--background2);
  }
`;
const EmptyMsg = styled.div`
  padding: 20px;
  text-align: center;
  color: var(--font2);
  font-size: 12px;
`;
