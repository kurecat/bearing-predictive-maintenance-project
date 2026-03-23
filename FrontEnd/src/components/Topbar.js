import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { NotificationContext } from "./Layout";

export default function Topbar({ toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { notifications, markAsRead } = useContext(NotificationContext);

  const [tabs, setTabs] = useState([
    {
      path: "/",
      label: "대시보드",
      isFixed: true,
    },
  ]);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const alertRef = useRef(null);

  const unreadCount = notifications
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  const getTabLabel = (path) => {
    if (path.includes("/history")) return "데이터 예측 및 이력";
    if (path.includes("/analysis")) return "Analysis";
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

  const handleToggleAlert = () => {
    if (!isAlertOpen && markAsRead) {
      markAsRead();
    }
    setIsAlertOpen(!isAlertOpen);
  };

  const currentTab = tabs.find((t) => t.path === location.pathname);
  const isCurrentFavorite = currentTab?.isFavorite || false;
  const isDashboard = location.pathname === "/";

  const toggleFavorite = () => {
    if (isDashboard) return;

    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) =>
        tab.path === location.pathname
          ? { ...tab, isFavorite: !tab.isFavorite }
          : tab,
      );
      return updatedTabs.sort((a, b) => {
        if (a.isFixed) return -1;
        if (b.isFixed) return 1;
        return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
      });
    });
  };

  const handleTabClick = (path) => navigate(path);

  const handleCloseTab = (e, pathToClose) => {
    e.stopPropagation();
    const targetTab = tabs.find((t) => t.path === pathToClose);
    if (targetTab?.isFixed || targetTab?.isFavorite) return;

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

        <IconButton
          onClick={isDashboard ? undefined : toggleFavorite}
          title={isDashboard ? "기본 페이지 (고정됨)" : "현재 탭 고정"}
          $isDashboard={isDashboard}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={!isDashboard && isCurrentFavorite ? "#facc15" : "none"}
            stroke={
              !isDashboard && isCurrentFavorite ? "#facc15" : "currentColor"
            }
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
              $isFixed={tab.isFixed}
              onClick={() => handleTabClick(tab.path)}
            >
              {tab.isFixed && (
                <FixedIcon className="fixed-icon">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
                  </svg>
                </FixedIcon>
              )}
              {tab.isFavorite && !tab.isFixed && <TabStar>★</TabStar>}
              {tab.label}
              {!tab.isFixed && !tab.isFavorite && (
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
  cursor: ${(props) => (props.$isDashboard ? "default" : "pointer")};
  color: ${(props) => (props.$isDashboard ? "var(--border)" : "var(--font2)")};
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  &:hover {
    background-color: ${(props) =>
      props.$isDashboard ? "transparent" : "var(--background2)"};
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

// [수정] FixedIcon 스타일: 평소에는 너비와 투명도를 0으로 설정
const FixedIcon = styled.span`
  display: flex;
  align-items: center;
  color: var(--font2);
  opacity: 0;
  width: 0;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
`;

const TabItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: var(--fontMd);
  font-weight: ${(props) =>
    props.$isActive ? "var(--bold)" : "var(--medium)"};
  color: ${(props) => (props.$isActive ? "var(--main)" : "var(--font2)")};
  background-color: ${(props) => (props.$isActive ? "#eff6ff" : "transparent")};

  cursor: pointer;
  white-space: nowrap;

  &:hover {
    .fixed-icon {
      opacity: 0.6;
      width: 14px; // 아이콘 크기 + 간격만큼 확장
      margin-right: 4px;
    }
    .close-btn {
      opacity: 1;
    }
  }
`;

const TabStar = styled.span`
  color: #facc15;
  margin-right: 6px;
`;
const CloseButton = styled.span`
  display: flex;
  align-items: center;
  margin-left: 6px;
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
