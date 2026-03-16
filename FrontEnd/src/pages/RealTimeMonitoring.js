import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

// 가상 데이터 생성기
const initialNodes = Array.from({ length: 9 }, (_, i) => ({
  id: `MTR-${101 + i}`,
  name: `라인-${String.fromCharCode(65 + Math.floor(i / 3))} 모터 ${(i % 3) + 1}`,
  vibration: 0.02,
  current: 2.1,
  prob: 5,
  history: Array.from({ length: 20 }, () => ({ val: 0.02 })), // 차트용 데이터
}));

export default function RealTimeMonitoring() {
  const [nodes, setNodes] = useState(initialNodes);

  // 실시간 시뮬레이션 로직 (1초마다 업데이트)
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          // 약간의 랜덤 변동성 부여
          const randV = Math.max(
            0.01,
            node.vibration + (Math.random() - 0.5) * 0.01,
          );

          // 특정 노드(MTR-105)에 고의로 고장 징후 시뮬레이션
          const isTarget = node.id === "MTR-105";
          const finalV = isTarget ? randV + 0.05 : randV;

          // 고장 확률 로직 (진동 수치만으로 계산하도록 단순화)
          const finalProb = Math.min(100, Math.floor((finalV / 0.2) * 100));

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
  }, []);

  return (
    <PageContainer>
      <Header>
        <TitleGroup>
          <Title>실시간 모터 통합 관제 (9분할 화면)</Title>
        </TitleGroup>
        <StatusSummary>
          시스템 가동률: <Highlight>98.2%</Highlight> | 전체 모터:{" "}
          <Highlight>9대</Highlight>
        </StatusSummary>
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
                {node.prob >= 70
                  ? "위험"
                  : node.prob >= 40
                    ? "경고"
                    : "정상 가동"}
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

            {/* 그래프 영역을 넓고 크게 변경 */}
            <LargeChartContainer>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={node.history}>
                  <Line
                    type="monotone"
                    dataKey="val"
                    stroke={node.prob >= 70 ? "#ef4444" : "#3b82f6"}
                    strokeWidth={3} /* 선 굵기 증가 */
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
                <SubValue style={{ color: "var(--main)", fontWeight: "bold" }}>
                  {node.prob}%
                </SubValue>
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
                $color={node.prob >= 70 ? "#ef4444" : "#3b82f6"}
              />
            </ProgressBarBg>
          </NodeCard>
        ))}
      </GridContainer>
    </PageContainer>
  );
}

const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
`;

const PageContainer = styled.div`
  width: 100%;
  padding: 30px;
  box-sizing: border-box;
  background-color: var(--background2);
  min-height: calc(100vh - 50px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  width: 100%;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LiveDot = styled.div`
  width: 10px;
  height: 10px;
  background-color: #ef4444;
  border-radius: 50%;
  animation: ${blink} 1.5s infinite;
`;

const Title = styled.h2`
  font-size: var(--fontTitle);
  color: var(--font);
  font-weight: 800;
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
  border: 1px solid ${(props) => (props.$isDanger ? "#fecaca" : "#e2e8f0")};
  box-shadow: var(--shadow);
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-4px);
  }
  background-color: ${(props) => (props.$isDanger ? "#fffafb" : "white")};
`;

const NodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px; /* 간격 소폭 조정 */
`;

const NodeInfo = styled.div``;

const NodeID = styled.div`
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
`;

const NodeName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
`;

const Badge = styled.div`
  font-size: 11px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${(props) =>
    props.$type === "danger"
      ? "#fee2e2"
      : props.$type === "warning"
        ? "#fef3c7"
        : "#d1fae5"};
  color: ${(props) =>
    props.$type === "danger"
      ? "#ef4444"
      : props.$type === "warning"
        ? "#d97706"
        : "#059669"};
`;

const ContentRow = styled.div`
  display: flex;
  flex-direction: column; /* 세로 정렬로 변경 */
  margin-bottom: 10px;
`;

const MainValue = styled.div``;

const Label = styled.div`
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 4px;
`;

const Value = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: ${(props) => (props.$isDanger ? "#ef4444" : "#1e293b")};
`;

const Unit = styled.span`
  font-size: 12px;
  color: #94a3b8;
`;

/* 크기가 커진 차트 컨테이너 */
const LargeChartContainer = styled.div`
  width: 100%;
  margin-bottom: 16px;
  background-color: #f8fafc; /* 차트 배경색을 살짝 넣어 구분을 줌 */
  border-radius: 8px;
  padding: 8px 0;
`;

const SubDataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  margin-bottom: 12px;
`;

const SubItem = styled.div``;

const SubValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #334155;
`;

const ProgressBarBg = styled.div`
  height: 6px;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${(props) => props.$width}%;
  background-color: ${(props) => props.$color};
  transition: width 0.5s ease-in-out;
`;
