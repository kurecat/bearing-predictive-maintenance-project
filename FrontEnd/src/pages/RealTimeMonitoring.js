import React, { useState, useEffect, useContext } from "react";
import styled, { keyframes } from "styled-components";
import { NotificationContext } from "../components/Layout";

const initialNodes = Array.from({ length: 9 }, (_, i) => ({
  id: `MTR-${101 + i}`,
  name: `${i + 1}호기`,
  vibration: 0.02,
  prob: 5,
}));

export default function RealTimeMonitoring() {
  const [nodes, setNodes] = useState(initialNodes);
  const { addNotification, addSensorRecord } = useContext(NotificationContext);
  const [alerts, setAlerts] = useState([]);

  const triggerAlert = (name, prob, status) => {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toISOString().split("T")[0];
    const newAlert = { id: Date.now(), name, prob, time, date, status };
    setAlerts((prev) => [...prev, newAlert]);

    if (addNotification) {
      addNotification({
        id: newAlert.id,
        message: `[${status === "danger" ? "점검" : "주의"}] ${name} 고장 확률 ${prob}%`,
        time: time,
      });
    }
  };

  const handleCloseAlerts = () => setAlerts([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const randV = Math.max(
            0.01,
            node.vibration + (Math.random() - 0.5) * 0.01,
          );
          const isTarget = node.id === "MTR-105";
          const finalV = isTarget ? randV + 0.05 : randV;
          const finalProb = Math.min(100, Math.floor((finalV / 0.2) * 100));

          const now = new Date();
          const dateString = now.toISOString().split("T")[0];
          const timeString = now.toLocaleTimeString();

          // 1. 30%를 돌파했을 때 (주의 알림)
          if (finalProb >= 30 && finalProb < 70 && node.prob < 30) {
            triggerAlert(node.name, finalProb, "warning");
          }
          // 2. 70%를 돌파했을 때 (점검 알림)
          else if (finalProb >= 70 && node.prob < 70) {
            triggerAlert(node.name, finalProb, "danger");
          }

          if (addSensorRecord) {
            addSensorRecord({
              id: node.id,
              vibration: parseFloat(finalV.toFixed(3)),
              prob: finalProb,
              label: finalProb >= 80 ? 1 : 0,
              date: dateString,
              time: timeString,
            });
          }

          return {
            ...node,
            vibration: parseFloat(finalV.toFixed(3)),
            prob: finalProb,
          };
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [addSensorRecord]);

  return (
    <PageContainer>
      <Header>
        <TitleGroup>
          <Title>실시간 설비 모니터링</Title>
        </TitleGroup>
        <RightControls>
          <StatusSummary>
            전체 가동 설비: <Highlight>{nodes.length}대</Highlight>
          </StatusSummary>
        </RightControls>
      </Header>

      <GridContainer>
        {nodes.map((node) => {
          const isDanger = node.prob >= 70;
          const isWarning = node.prob >= 30 && node.prob < 70;

          const healthScore = 100 - node.prob;
          const activeSegments = Math.floor(healthScore / 5);

          const vibWidth = Math.min((node.vibration / 0.15) * 100, 100);

          return (
            <Card key={node.id}>
              <CardLeft>
                <MachineName>{node.name}</MachineName>
                <BigNumber>
                  {node.prob.toFixed(1)}
                  <UnitSpan>%</UnitSpan>
                </BigNumber>
                <StatusBadge
                  $status={
                    isDanger ? "danger" : isWarning ? "warning" : "normal"
                  }
                >
                  {isDanger ? "점검" : isWarning ? "주의" : "가동"}
                </StatusBadge>
              </CardLeft>

              <CardRight>
                <SegmentedBar>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <Segment
                      key={i}
                      $active={i < activeSegments}
                      $status={
                        isDanger ? "danger" : isWarning ? "warning" : "normal"
                      }
                    />
                  ))}
                </SegmentedBar>

                <StatsGrid>
                  <StatLabel>장비ID</StatLabel>
                  <StatValue>{node.id}</StatValue>

                  <StatLabel>수치</StatLabel>
                  <StatValue>{node.vibration}</StatValue>
                </StatsGrid>
              </CardRight>
            </Card>
          );
        })}
      </GridContainer>

      {alerts.length > 0 && (
        <AlertModalOverlay>
          <AlertModalContent>
            <AlertHeader>
              <TextBox>
                <WarningIcon>⚠️</WarningIcon>
                <AlertTitle>시스템 상태 알림</AlertTitle>
              </TextBox>
              <CloseIcon onClick={handleCloseAlerts}>✕</CloseIcon>
            </AlertHeader>
            <AlertList>
              {alerts.map((alert) => (
                <AlertItem key={alert.id}>
                  <Msg>
                    <Msg3 $status={alert.status}>
                      [{alert.status === "danger" ? " 🚨점검 " : " 🟠주의 "}]
                    </Msg3>
                    <Msg3>
                      {alert.name}의 고장 확률
                      <Msg2 $status={alert.status}>
                        <Probability $status={alert.status}>
                          {" "}
                          {alert.prob}%
                        </Probability>
                      </Msg2>
                    </Msg3>
                  </Msg>
                </AlertItem>
              ))}
            </AlertList>
            <AlertButton onClick={handleCloseAlerts}>
              내용 확인 완료
            </AlertButton>
          </AlertModalContent>
        </AlertModalOverlay>
      )}
    </PageContainer>
  );
}

const blink = keyframes`0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; }`;

const PageContainer = styled.div`
  padding: 30px;
  background-color: var(--background2);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h2`
  font-size: var(--fontTitle);
  color: var(--font);
  font-weight: var(--titleBold);
  margin: 0 0 8px 0;
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const StatusSummary = styled.div`
  font-size: 14px;
  color: var(--font2);
`;

const Highlight = styled.span`
  color: var(--font);
  font-weight: 700;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  background: var(--background);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 20px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-2px);
  }
`;

const CardLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 70px;
`;

const MachineName = styled.div`
  font-size: 14px;
  color: var(--font);
  font-weight: 700;
  margin-bottom: 8px;
`;

const BigNumber = styled.div`
  font-size: 26px;
  color: var(--font);
  font-weight: 800;
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;
`;

const UnitSpan = styled.span`
  font-size: 14px;
  color: var(--font2);
  font-weight: 500;
  margin-left: 2px;
`;

const StatusBadge = styled.div`
  background-color: ${(props) =>
    props.$status === "danger"
      ? "var(--error)"
      : props.$status === "warning"
        ? "var(--waiting)"
        : "var(--main)"};
  color: white;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  padding: 4px 0;
  border-radius: 20px;
  width: 60px;
`;

const CardRight = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const SegmentedBar = styled.div`
  display: flex;
  gap: 2px;
  width: 100%;
  height: 6px;
  margin-bottom: 16px;
`;

const Segment = styled.div`
  flex: 1;
  border-radius: 1px;
  background-color: ${(props) => {
    if (!props.$active) return "var(--main2)";
    if (props.$status === "danger") return "var(--error)";
    if (props.$status === "warning") return "var(--waiting)";
    return "var(--main)";
  }};
`;

const StatsGrid = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: var(--font2);
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 12px;
  color: var(--font);
  font-weight: 700;
  white-space: nowrap;
`;

const MiniBarWrapper = styled.div`
  width: 100%;
  height: 4px;
  background-color: var(--background2);
  border-radius: 2px;
  overflow: hidden;
  display: flex;
`;

const MiniBarFill = styled.div`
  height: 100%;
  width: ${(props) => props.$width}%;
  background-color: ${(props) => props.$color};
  transition: width 0.5s ease-in-out;
`;

const AlertModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const AlertModalContent = styled.div`
  background-color: var(--background);
  position: relative;
  width: 400px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow);
  border: 2px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const TextBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const WarningIcon = styled.span`
  font-size: 24px;
  animation: ${blink} 1s linear infinite;
`;

const AlertTitle = styled.h3`
  margin: 0;
  margin-top: 5px;
  font-size: 20px;
  color: var(--error);
  font-weight: 700;
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
  max-height: 200px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--font);
    border-radius: 3px;
  }
`;

const AlertItem = styled.div`
  font-size: 14px;
  color: var(--font);
  font-weight: 700;
  min-height: 130px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f2f2f2;
  bpx-shadow: var(--shadow);
  border-radius: 8px
  padding: 12px 16px;
  border-radius: 8px;
`;

const Msg = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
`;

const Msg2 = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  color: ${(props) =>
    props.$status === "danger" ? "var(--error)" : "var(--waiting)"};
`;

const Msg3 = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
`;

const Probability = styled.div`
  color: ${(props) =>
    props.$status === "danger" ? "var(--error)" : "var(--waiting)"};
  font-weight: 800;
  font-size: 16px;
`;

const AlertButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: var(--main);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.2s;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

const CloseIcon = styled.button`
  font-size: 20px;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: var(--error);
  }
`;
