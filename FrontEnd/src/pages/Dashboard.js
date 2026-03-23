import React, { useState, useEffect, useContext } from "react";
import styled, { keyframes } from "styled-components";
import {
  Area,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { NotificationContext } from "../components/Layout";
import SocketQueue from '../api/SocketQueue.js';

// 9개 모터 초기 상태
const initialNodes = Array.from({ length: 9 }, (_, i) => ({
  id: `MTR-${101 + i}`,
  name: `${i + 1}호기`,
  vibration: 0.02,
  current: 2.1,
  prob: 5,
}));

export default function Dashboard() {
  // const [nodes, setNodes] = useState(initialNodes);
  const [nodes, setNodes] = useState([]);
  const { addNotification, addSensorRecord } = useContext(NotificationContext);
  const [alerts, setAlerts] = useState([]);
  const socketQueue = new SocketQueue('ws://localhost:8000/socket/devices');

  // 알림 트리거 함수
  const triggerAlert = (name, prob, status) => {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toISOString().split("T")[0];
    const newAlert = { id: Date.now(), name, prob, time, date, status };
    setAlerts((prev) => [...prev, newAlert]);

    if (addNotification) {
      addNotification({
        id: newAlert.id,
        message: `[${status === "danger" ? "고장" : "위험"}] ${name} 고장 확률 ${prob}%`,
        time: time,
      });
    }
  };

  const handleCloseAlerts = () => setAlerts([]);

  // 1초마다 실시간 데이터 시뮬레이션
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setNodes((prevNodes) =>
  //       prevNodes.map((node) => {
  //         const randV = Math.max(
  //           0.01,
  //           node.vibration + (Math.random() - 0.5) * 0.01,
  //         );
  //         const isTarget = node.id === "MTR-105";
  //         const finalV = isTarget ? randV + 0.05 : randV;
  //         const finalProb = Math.min(100, Math.floor((finalV / 0.2) * 100));

  //         const finalC = parseFloat(
  //           (2.1 + (Math.random() - 0.5) * 0.2).toFixed(2),
  //         );

  //         const now = new Date();
  //         const dateString = now.toISOString().split("T")[0];
  //         const timeString = now.toLocaleTimeString();

  //         // 30% 이상일 때 주의 알림
  //         if (finalProb >= 30 && finalProb < 70 && node.prob < 30) {
  //           triggerAlert(node.name, finalProb, "warning");
  //         }
  //         // 70% 이상일 때 점검 알림
  //         else if (finalProb >= 70 && node.prob < 70) {
  //           triggerAlert(node.name, finalProb, "danger");
  //         }

  //         if (addSensorRecord) {
  //           addSensorRecord({
  //             id: node.id,
  //             vibration: parseFloat(finalV.toFixed(3)),
  //             current: finalC,
  //             prob: finalProb,
  //             label: finalProb >= 80 ? 1 : 0,
  //             date: dateString,
  //             time: timeString,
  //           });
  //         }

  //         return {
  //           ...node,
  //           vibration: parseFloat(finalV.toFixed(3)),
  //           current: finalC,
  //           prob: finalProb,
  //         };
  //       }),
  //     );
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, [addSensorRecord]);

  useEffect(() => {
    socketQueue.connect();
    socketQueue.onMessage((message) => {
      console.log("Received message from WebSocket:", message);
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) =>
          node.id === message.id ? { ...node, ...message } : node,
        );
        return updatedNodes;
      });
    });
  }, []);

  // 실시간 데이터를 기반으로 Dashboard 통계 동적 계산
  const normalMotors = nodes.filter((n) => n.prob < 30).length;
  const warningMotors = nodes.filter((n) => n.prob >= 30 && n.prob < 70).length;
  const dangerMotors = nodes.filter((n) => n.prob >= 70).length;
  const totalMotors = nodes.length;

  const statusData = [
    { name: "정상 가동", value: normalMotors, color: "var(--main)" },
    { name: "위험! 고장 예상", value: warningMotors, color: "var(--waiting)" },
    { name: "고장 상태", value: dangerMotors, color: "var(--error)" },
  ];

  const riskData = [...nodes]
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 5)
    .map((n) => ({
      name: n.name,
      avgProb: n.prob,
    }));

  return (
    <PageContainer>
      <HeaderContainer>
        <div>
          <PageTitle>종합 통계 대시보드</PageTitle>
          <PageSubtitle>
            실시간 설비 가동 현황 및 AI 예측 통계 요약
          </PageSubtitle>
        </div>
      </HeaderContainer>

      <TopGrid>
        <KpiContainer>
          <ChartTitle>전체 모터 상태</ChartTitle>
          <KpiRow>
            <KpiCircle $color="var(--font)" />
            <KpiTextWrapper>
              전체
              <KpiValue>{totalMotors}대</KpiValue>
            </KpiTextWrapper>
          </KpiRow>
          <KpiRow>
            <KpiCircle $color="var(--main)" />
            <KpiTextWrapper>
              정상
              <KpiValue style={{ color: "var(--main)" }}>
                {normalMotors}대
              </KpiValue>
            </KpiTextWrapper>
          </KpiRow>
          <KpiRow>
            <KpiCircle $color="var(--waiting)" />
            <KpiTextWrapper>
              위험
              <KpiValue style={{ color: "var(--waiting)" }}>
                {warningMotors}대
              </KpiValue>
            </KpiTextWrapper>
          </KpiRow>
          <KpiRow>
            <KpiCircle $color="var(--error)" />
            <KpiTextWrapper>
              고장
              <KpiValue style={{ color: "var(--error)" }}>
                {dangerMotors}대
              </KpiValue>
            </KpiTextWrapper>
          </KpiRow>
        </KpiContainer>

        <ChartCard $flex={1}>
          <ChartTitle>전체 모터 상태 비율</ChartTitle>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow)",
                    fontSize: "13px",
                    fontWeight: "var(--bold)",
                    color: "var(--font)",
                  }}
                  itemStyle={{ fontWeight: "var(--medium)" }}
                />
                {/* <Legend
                  verticalAlign="bottom"
                  height={30}
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    fontWeight: "var(--bold)",
                    color: "var(--font2)",
                  }}
                /> */}
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartCard>

        <ChartCard $flex={2}>
          <ChartTitle>고위험 모터 TOP 5 (실시간 위험도순)</ChartTitle>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                layout="vertical"
                data={riskData}
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={false}
                  stroke="var(--border)"
                />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "var(--font2)",
                    fontWeight: "var(--bold)",
                  }}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: "var(--background2)" }}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow)",
                    fontSize: "13px",
                    fontWeight: "var(--bold)",
                  }}
                />
                <Bar
                  dataKey="avgProb"
                  name="실시간 위험 확률(%)"
                  fill="var(--main)"
                  radius={[0, 8, 8, 0]}
                  barSize={15}
                  isAnimationActive={false}
                  label={{
                    position: "right",
                    fill: "var(--font2)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartCard>
      </TopGrid>

      <ChartTitle style={{ marginTop: "10px" }}>
        개별 모터 실시간 관제
      </ChartTitle>
      <RealTimeGridContainer>
        {nodes.map((node) => {
          const isDanger = node.prob >= 70;
          const isWarning = node.prob >= 30 && node.prob < 70;

          const healthScore = 100 - node.prob;
          const activeSegments = Math.floor(node.prob / 5);
          const vibWidth = Math.min((node.vibration / 0.15) * 100, 100);

          return (
            <RealTimeCard key={node.id}>
              <CardLeft>
                <MachineName>{node.name}</MachineName>
                <BigNumber>
                  {node.prob.toFixed(1)}
                  <UnitSpan>%</UnitSpan>
                </BigNumber>
                <NodeStatusBadge
                  $status={
                    isDanger ? "danger" : isWarning ? "warning" : "normal"
                  }
                >
                  {isDanger ? "점검" : isWarning ? "주의" : "가동"}
                </NodeStatusBadge>
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

                <CardStatsGrid>
                  <StatLabel>장비ID</StatLabel>
                  <StatValue>{node.id}</StatValue>

                  <StatLabel>수치</StatLabel>
                  <StatValue>{node.vibration}</StatValue>
                </CardStatsGrid>
              </CardRight>
            </RealTimeCard>
          );
        })}
      </RealTimeGridContainer>

      {/* 알림 모달 */}
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
                      [{alert.status === "danger" ? " 🚨고장 " : " 🟠위험 "}]
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

const PageContainer = styled.div`
  width: 100%;
  padding: 30px;
  box-sizing: border-box;
  background-color: var(--background2);
  min-height: calc(100vh - 50px);
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  width: 100%;
`;

const PageTitle = styled.h2`
  font-size: var(--fontTitle);
  color: var(--font);
  font-weight: var(--titleBold);
  margin: 0 0 8px 0;
`;

const PageSubtitle = styled.p`
  font-size: 14px;
  color: var(--font2);
  margin: 0;
`;

const TopGrid = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  width: 100%;
  align-items: stretch;
`;

const KpiContainer = styled.div`
  flex: ${(props) => props.$flex || 1};
  min-width: 0;
  background-color: var(--background);
  padding: 20px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;

const KpiRow = styled.div`
  display: flex;
  height: 40px;
  align-items: center;
  padding: 20px 0;
  gap: 20px;
  border-bottom: 1px solid var(--border);
  &:last-child {
    border-bottom: none;
  }
`;

const KpiCircle = styled.div`
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 4px solid ${(props) => props.$color || "var(--font)"};
  box-sizing: border-box;
`;

const KpiTextWrapper = styled.div`
  display: flex;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  align-items: center;
`;

const KpiValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: var(--font);
  line-height: 1;
`;

const KpiLabel = styled.div`
  font-size: 18px;
  color: var(--font);
  font-weight: 500;
`;

const ChartCard = styled.div`
  flex: ${(props) => props.$flex || 1};
  min-width: 0;
  background-color: var(--background);
  padding: 20px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;

const ChartTitle = styled.h2`
  font-size: 16px;
  color: var(--font);
  font-weight: 800;
  margin-bottom: 20px;
  margin-top: 0;
`;

const ChartWrapper = styled.div`
  height: 150px;
  width: 100%;
  margin-top: 10px;
  flex-grow: 1;
`;

const blink = keyframes`0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; }`;

const RealTimeGridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const RealTimeCard = styled.div`
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

const NodeStatusBadge = styled.div`
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

const CardStatsGrid = styled.div`
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
  box-shadow: var(--shadow);
  border-radius: 8px;
  padding: 12px 16px;
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
