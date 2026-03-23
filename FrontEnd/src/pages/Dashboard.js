import React, { useState, useEffect, useContext } from "react";
import styled, { keyframes } from "styled-components";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { NotificationContext } from "../components/Layout";

export default function Dashboard() {
  const [nodes, setNodes] = useState([]);
  const { sensorHistory } = useContext(NotificationContext);
  const [alerts, setAlerts] = useState([]);

  const handleCloseAlerts = () => setAlerts([]);

  // 1. 초기 데이터 로드 및 sensorHistory 변경 감지
  useEffect(() => {
    if (!sensorHistory || sensorHistory.length === 0) return;

    // ID별로 가장 최신 데이터 하나씩만 추출하여 노드 리스트 구성
    const latestById = {};
    const orderedNodes = [];

    // 역순으로 탐색하거나, Map을 사용하여 중복 제거
    [...sensorHistory].reverse().forEach((record) => {
      latestById[record.id] = {
        id: record.id,
        name: record.name,
        vibration: record.vibration,
        prob: record.prob,
        date: record.date,
        time: record.time,
        filename: record.filename,
      };
    });

    setNodes(Object.values(latestById));
  }, [sensorHistory]);

  // 2. 통계 데이터 계산
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
              전체 <KpiValue>{totalMotors}대</KpiValue>
            </KpiTextWrapper>
          </KpiRow>
          <KpiRow>
            <KpiCircle $color="var(--main)" />
            <KpiTextWrapper>
              정상{" "}
              <KpiValue style={{ color: "var(--main)" }}>
                {normalMotors}대
              </KpiValue>
            </KpiTextWrapper>
          </KpiRow>
          <KpiRow>
            <KpiCircle $color="var(--waiting)" />
            <KpiTextWrapper>
              위험{" "}
              <KpiValue style={{ color: "var(--waiting)" }}>
                {warningMotors}대
              </KpiValue>
            </KpiTextWrapper>
          </KpiRow>
          <KpiRow>
            <KpiCircle $color="var(--error)" />
            <KpiTextWrapper>
              고장{" "}
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
                  innerRadius={30}
                  outerRadius={50}
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
                    fontSize: "13px",
                  }}
                />
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
                <Tooltip cursor={{ fill: "var(--background2)" }} />
                <Bar
                  dataKey="avgProb"
                  name="실시간 위험 확률(%)"
                  fill="var(--main)"
                  radius={[0, 8, 8, 0]}
                  barSize={10}
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
          const activeSegments = Math.floor(node.prob / 5);

          return (
            <RealTimeCard key={node.id}>
              <CardLeft>
                <MachineName>{node.id}</MachineName>
                <BigNumber>
                  {node.prob}
                  <UnitSpan>%</UnitSpan>
                </BigNumber>
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
                  <Stats>
                    <StatLabel>수치</StatLabel>
                    <StatValue>{node.vibration}</StatValue>
                  </Stats>
                  <Stats>
                    <NodeStatusBadge
                      $status={
                        isDanger ? "danger" : isWarning ? "warning" : "normal"
                      }
                    >
                      {isDanger ? "고장" : isWarning ? "위험" : "정상"}
                    </NodeStatusBadge>
                  </Stats>
                </CardStatsGrid>
              </CardRight>
            </RealTimeCard>
          );
        })}
      </RealTimeGridContainer>
    </PageContainer>
  );
}

// Styled Components (기존과 동일하므로 생략하거나 기존 내용 유지)
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
  flex: 1;
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
  height: 20px;
  align-items: center;
  padding: 15px 0;
  gap: 15px;
  border-bottom: 1px solid var(--border);
  &:last-child {
    border-bottom: none;
  }
`;
const KpiCircle = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 4px solid ${(props) => props.$color};
  box-sizing: border-box;
`;
const KpiTextWrapper = styled.div`
  display: flex;
  gap: 10px;
  font-weight: 700;
  font-size: 14px;
  align-items: center;
`;
const KpiValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: var(--font);
`;
const ChartCard = styled.div`
  flex: ${(props) => props.$flex || 1};
  background-color: var(--background);
  padding: 20px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
`;
const ChartTitle = styled.h2`
  font-size: 16px;
  color: var(--font);
  font-weight: 800;
  margin-bottom: 20px;
`;
const ChartWrapper = styled.div`
  height: 100px;
  width: 100%;
  margin-top: 10px;
  flex-grow: 1;
`;
const RealTimeGridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
`;
const RealTimeCard = styled.div`
  background: var(--background);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 20px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
`;
const CardLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 70px;
`;
const MachineName = styled.div`
  font-size: 12px;
  color: var(--font);
  font-weight: 700;
`;
const BigNumber = styled.div`
  font-size: 20px;
  color: var(--font);
  font-weight: 800;
  display: flex;
  align-items: baseline;
`;
const UnitSpan = styled.span`
  font-size: 14px;
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
  font-size: 10px;
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
  background-color: ${(props) =>
    !props.$active
      ? "var(--main2)"
      : props.$status === "danger"
        ? "var(--error)"
        : props.$status === "warning"
          ? "var(--waiting)"
          : "var(--main)"};
`;
const CardStatsGrid = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const Stats = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const StatLabel = styled.div`
  font-size: 11px;
  color: var(--font2);
`;
const StatValue = styled.div`
  font-size: 12px;
  color: var(--font);
  font-weight: 700;
`;
