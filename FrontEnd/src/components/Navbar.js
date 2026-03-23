import React from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <SidebarContainer>
      <TopSection>
        <LogoArea to="/">Ai For Motor</LogoArea>
      </TopSection>

      <MenuList>
        <MenuItem to="/" $isActive={path === "/"}>
          대시보드
        </MenuItem>
        <MenuItem to="/history" $isActive={path === "/history"}>
          데이터 예측 및 이력
        </MenuItem>
        <MenuItem to="/analysis" $isActive={path === "/analysis"}>
          Analysis
        </MenuItem>
      </MenuList>

      <BottomSection>
        <ProfileArea>
          <Avatar>H</Avatar>
          <Greeting>Hi, Harin Kim</Greeting>
        </ProfileArea>
      </BottomSection>
    </SidebarContainer>
  );
};

export default Navbar;

const SidebarContainer = styled.div`
  width: 250px;
  height: 100vh;
  background-color: var(--background);
  border-right: 1px solid var(--border);

  display: flex;
  flex-direction: column;
  padding: 30px 20px;
`;

const TopSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
`;

const LogoArea = styled(Link)`
  font-size: 24px;
  font-weight: 800;
  color: var(--font);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
`;

const LogoIcon = styled.span`
  color: #3b82f6;
  margin-right: 8px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: #f1f5f9;
  border-radius: 12px;
  padding: 10px 16px;
  width: 100%;
`;

const SearchIcon = styled.span`
  color: #94a3b8;
  font-size: 16px;
`;

const SearchInput = styled.input`
  border: none;
  background-color: transparent;
  outline: none;
  font-size: 14px;
  color: #334155;
  width: 100%;
  margin-left: 8px;
`;

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
`;

const MenuItem = styled(Link)`
  padding: 12px 16px;
  font-size: 15px;
  display: flex;
  align-items: center;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;

  color: ${(props) => (props.$isActive ? "#3b82f6" : "#475569")};
  font-weight: ${(props) => (props.$isActive ? "700" : "500")};
  background-color: ${(props) => (props.$isActive ? "#eff6ff" : "transparent")};

  &:hover {
    background-color: #f1f5f9;
  }
`;

const BottomSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #475569;
  cursor: pointer;
`;

const ProfileArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: #64748b;
`;

const Greeting = styled.span`
  font-size: 14px;
  color: #334155;
  font-weight: 600;
`;
