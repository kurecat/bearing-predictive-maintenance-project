import React, { useState, useEffect, useContext } from "react";
import styled, { keyframes } from "styled-components";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { NotificationContext } from "../components/Layout";

const initialNodes = Array.from({ length: 9 }, (_, i) => ({
  id: `MTR-${101 + i}`,
  name: `라인-${String.fromCharCode(65 + Math.floor(i / 3))} 모터 ${(i % 3) + 1}`,
  vibration: 0.02,
  current: 2.1,
  prob: 5,
  history: Array.from({ length: 20 }, () => ({ val: 0.02 })),
}));

export default function RealTimeMonitoring() {
  const [nodes, setNodes] = useState(initialNodes);
  const { addNotification, addSensorRecord } = useContext(NotificationContext);
  const [alerts, setAlerts] = useState([]);

  const triggerAlert = (name, prob) => {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const newAlert = { id: Date.now(), name, prob, time, date };
    setAlerts((prev) => [...prev, newAlert]);

    if (addNotification) {
      addNotification({
        id: newAlert.id,
        message: `[위험] ${name} 고장 확률 ${prob}%`,
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

          // --- 날짜 및 시간 생성 (수정된 부분) ---
          const now = new Date();
          const dateString = now.toISOString().split("T")[0]; // "2026-03-17"
          const timeString = now.toLocaleTimeString();

          if (finalProb >= 80 && node.prob < 80)
            triggerAlert(node.name, finalProb);

          if (addSensorRecord) {
            addSensorRecord({
              id: node.id,
              vibration: parseFloat(finalV.toFixed(3)),
              current: node.current,
              prob: finalProb,
              label: finalProb >= 80 ? 1 : 0,
              date: dateString, // 날짜 전송
              time: timeString, // 시간 전송
            });
          }

          return {
            ...node,
            vibration: parseFloat(finalV.toFixed(3)),
            prob: finalProb,
            history: [...node.history.slice(1), { val: finalV }],
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
          <Title>실시간 모터 통합 관제</Title>
        </TitleGroup>
        <RightControls>
          <StatusSummary>
            전체 모터: <Highlight>{nodes.length}대</Highlight>
          </StatusSummary>
        </RightControls>
      </Header>

      <GridContainer>
        {nodes.map((node) => (
          <NodeCard key={node.id} $isDanger={node.prob >= 70}>
            <NodeHeader>
              <NodeInfo>
                <NodeID>{node.id}</NodeID>
                <NodeName>{node.name}</NodeName>
              </NodeInfo>
              <Badge
                $type={
                  node.prob >= 70
                    ? "danger"
                    : node.prob >= 40
                      ? "warning"
                      : "success"
                }
              >
                {node.prob >= 70 ? "위험" : node.prob >= 40 ? "경고" : "정상"}
              </Badge>
            </NodeHeader>
            <ContentRow>
              <MainValue>
                <Label>진동 수치</Label>
                <Value $isDanger={node.vibration >= 0.1}>
                  {node.vibration} <Unit>mm/s</Unit>
                </Value>
              </MainValue>
            </ContentRow>
            <LargeChartContainer>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={node.history}>
                  <Line
                    type="monotone"
                    dataKey="val"
                    stroke={node.prob >= 70 ? "var(--error)" : "var(--main)"}
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <YAxis hide domain={["auto", "auto"]} />
                </LineChart>
              </ResponsiveContainer>
            </LargeChartContainer>
            <SubDataGrid>
              <SubItem>
                <Label>전류량</Label>
                <SubValue>{node.current} A</SubValue>
              </SubItem>
              <SubItem>
                <Label>고장확률</Label>
                <SubValue>{node.prob}%</SubValue>
              </SubItem>
              <SubItem>
                <Label>현재 상태</Label>
                <SubValue
                  style={{
                    color: node.prob >= 70 ? "var(--error)" : "var(--font2)",
                  }}
                >
                  {node.prob >= 70 ? "점검 요망" : "이상 없음"}
                </SubValue>
              </SubItem>
            </SubDataGrid>
            <ProgressBarBg>
              <ProgressBarFill
                $width={node.prob}
                $color={node.prob >= 70 ? "var(--error)" : "var(--main)"}
              />
            </ProgressBarBg>
          </NodeCard>
        ))}
      </GridContainer>

      {alerts.length > 0 && (
        <AlertModalOverlay>
          <AlertModalContent>
            <AlertHeader>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <WarningIcon>⚠️</WarningIcon>
                <AlertTitle>시스템 위험 감지</AlertTitle>
              </div>
              <CloseIcon onClick={handleCloseAlerts}>✕</CloseIcon>
            </AlertHeader>
            <AlertList>
              {alerts.map((alert) => (
                <AlertItem key={alert.id}>
                  <div style={{ textAlign: "center", lineHeight: "1.6" }}>
                    <div>[위험]</div>
                    <div>
                      {alert.name}의 고장 확률 {alert.prob}%
                    </div>
                  </div>
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
  width: 100%;
  padding: 30px;
  box-sizing: border-box;
  background-color: var(--background2);
  min-height: calc(100vh - 50px);
  position: relative;
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
  font-weight: 800;
  margin: 0;
`;
const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;
const StatusSummary = styled.div`
  font-size: 14px;
  color: #64748b;
`;
const Highlight = styled.span`
  color: #0f172a;
  font-weight: 700;
`;
const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
`;
const NodeCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid
    ${(props) => (props.$isDanger ? "#fecaca" : "var(--border)")};
  box-shadow: var(--shadow);
  transition: transform 0.2s;
`;
const NodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;
const NodeInfo = styled.div``;
const NodeID = styled.div`
  font-size: var(--fontXs);
  color: var(--font2);
  font-weight: var(--bold);
`;
const NodeName = styled.div`
  font-size: var(--fontMd);
  font-weight: var(--bold);
  color: var(--font);
`;
const Badge = styled.div`
  font-size: var(--fontXxs);
  font-weight: var(--bold);
  padding: 4px 8px;
  border-radius: 20px;
  background-color: ${(props) =>
    props.$type === "danger"
      ? "var(--bgError)"
      : props.$type === "warning"
        ? "var(--bgWarning)"
        : "var(--bgRun)"};
  color: ${(props) =>
    props.$type === "danger"
      ? "var(--error)"
      : props.$type === "warning"
        ? "var(--waiting)"
        : "var(--run)"};
`;
const ContentRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;
const MainValue = styled.div``;
const Label = styled.div`
  font-size: var(--fontXs);
  color: var(--font2);
  font-weight: var(--bold);
  margin-bottom: 4px;
`;
const Value = styled.div`
  font-size: 24px;
  font-weight: var(--bold);
  color: ${(props) => (props.$isDanger ? "var(--error)" : "var(--font)")};
`;
const Unit = styled.span`
  font-size: var(--fontXs);
  color: var(--font2);
`;
const LargeChartContainer = styled.div`
  width: 100%;
  margin-bottom: 16px;
  background-color: var(--background2);
  border-radius: 8px;
  padding: 8px 0;
`;
const SubDataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding-top: 12px;
  border-top: 1px solid var(--border);
  margin-bottom: 12px;
`;
const SubItem = styled.div``;

const SubValue = styled.div`
  font-size: var(--fontSm);
  font-weight: var(--bold);
  color: var(--font);
`;
const ProgressBarBg = styled.div`
  height: 6px;
  background: var(--border);
  border-radius: 10px;
  overflow: hidden;
`;
const ProgressBarFill = styled.div`
  height: 100%;
  width: ${(props) => props.$width}%;
  background-color: ${(props) => props.$color};
  transition: width 0.5s ease-in-out;
`;

/* 검은색 모달 오버레이 스타일 유지 */
const AlertModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;
const AlertModalContent = styled.div`
  background-color: var(--background);
  width: 400px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow);
  border: 2px solid var(--border);
`;
const WarningIcon = styled.span`
  font-size: 24px;
  animation: ${blink} 1s linear infinite;
`;
const AlertTitle = styled.h3`
  margin: 0;
  margin-top: 5px;
  font-size: var(--fontLg);
  color: var(--error);
  font-weight: var(--bold);
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
    background-color: var(--error);
    border-radius: 3px;
  }
`;
const AlertItem = styled.div`
  font-size: var(--fontSm);
  color: var(--error);
  font-weight: var(--bold);
  min-height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bgError);
  padding: 12px 16px;
  border-radius: 8px;
`;
const AlertButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: var(--error);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: var(--fontSm);
  font-weight: var(--bold);
  transition: all 0.2s;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;
const CloseIcon = styled.button`
  font-size: 20px;
  color: var(--font2);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: var(--error);
  }
`;
