import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

export default function Topbar({ toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [tabs, setTabs] = useState([]);

  const getTabLabel = (path) => {
    if (path.includes("/report")) return "분석 리포트";
    if (path.includes("/real-time")) return "실시간 모니터링";
    return "대시보드";
  };

  // 페이지 이동 시 탭 추가
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

  const isCurrentFavorite =
    tabs.find((t) => t.path === location.pathname)?.isFavorite || false;

  // 즐겨찾기 토글 (고정 및 정렬 로직 포함)
  const toggleFavorite = () => {
    setTabs((prevTabs) => {
      // 상태 업데이트
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

  const handleTabClick = (path) => {
    navigate(path);
  };

  const handleCloseTab = (e, pathToClose) => {
    e.stopPropagation();

    const targetTab = tabs.find((t) => t.path === pathToClose);
    if (targetTab?.isFavorite) return;

    const newTabs = tabs.filter((tab) => tab.path !== pathToClose);
    setTabs(newTabs);

    if (location.pathname === pathToClose) {
      if (newTabs.length > 0) {
        navigate(newTabs[newTabs.length - 1].path);
      } else {
        navigate("/");
      }
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
            strokeLinecap="round"
            strokeLinejoin="round"
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
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </IconButton>

        <TabContainer>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <TabItem
                key={tab.path}
                $isActive={isActive}
                onClick={() => handleTabClick(tab.path)}
              >
                {tab.isFavorite && <TabStar>★</TabStar>}
                {tab.label}

                {!tab.isFavorite && (
                  <CloseButton
                    className="close-btn"
                    onClick={(e) => handleCloseTab(e, tab.path)}
                    title="탭 닫기"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </CloseButton>
                )}
              </TabItem>
            );
          })}
        </TabContainer>
      </LeftSection>

      <RightSection>
        {/* 일단 모양만 만들어놓음 */}
        <SearchBox>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--font2)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <SearchInput
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBox>

        <IconButton
          onClick={() => alert("새로운 알림이 없습니다.")}
          title="알림"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </IconButton>
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
  flex-shrink: 0;

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
  padding: 4px 0;

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
  transition: all 0.3s ease; /* 탭 이동 시 부드러운 전환 효과 추가 */
  white-space: nowrap;

  &:hover {
    background-color: ${(props) =>
      props.$isActive ? "#eff6ff" : "var(--background2)"};
    color: ${(props) => (props.$isActive ? "var(--main)" : "var(--font)")};

    .close-btn {
      opacity: 1;
      pointer-events: auto;
    }
  }
`;

const TabStar = styled.span`
  margin-right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: #facc15;
`;

const CloseButton = styled.span`
  margin-left: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: var(--font2);
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--border);
    color: var(--error);
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--background2);
  border-radius: 8px;
  padding: 8px 12px;
  margin-right: 12px;
  width: 200px;
  border: 1px solid transparent;
  transition:
    width 0.3s ease,
    background-color 0.3s ease,
    border 0.3s ease;

  &:focus-within {
    width: 250px;
    background-color: var(--background);
    border: 1px solid var(--border);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  margin-left: 8px;
  font-size: var(--fontSm);
  color: var(--font);
  width: 100%;

  &::placeholder {
    color: var(--font2);
  }
`;
