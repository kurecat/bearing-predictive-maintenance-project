import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
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

  const [currentPage, setCurrentPage] = useState(1);

  const gridRef = useRef(null);
  const cardRef = useRef(null);

  const [initialItemsPerPage, setInitialItemsPerPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentItems, setCurrentItems] = useState([]);

  useEffect(() => {
    if (!gridRef.current) return;

    const containerHeight = gridRef.current.offsetHeight;
    const cardHeight = gridRef.current.querySelector(".RealTimeCard")?.offsetHeight || 100;
    const gap = 20;
    const cols = 3;
    const rowHeight = cardHeight + gap;
    const rowsPerPage = Math.floor(containerHeight / rowHeight);

    const perPage = rowsPerPage * cols;

    // 첫 페이지용 값은 최초 한 번만 세팅
    if (initialItemsPerPage === 0) {
      setInitialItemsPerPage(perPage);
    }
    // 이후 페이지용 값은 계속 갱신
    setItemsPerPage(perPage);

    console.log("initialItemsPerPage:", initialItemsPerPage);
    console.log("itemsPerPage:", perPage);
  }, [nodes, currentPage]);

  useEffect(() => {
    if (initialItemsPerPage === 0) return;

    let startIndex, endIndex;

    if (currentPage === 1) {
      startIndex = 0;
      endIndex = initialItemsPerPage;
    } else {
      // 두 번째 페이지부터는 itemsPerPage 사용
      startIndex = initialItemsPerPage + (currentPage - 2) * itemsPerPage;
      endIndex = startIndex + itemsPerPage;
    }

    setCurrentItems(nodes.slice(startIndex, endIndex));

    const total = Math.ceil(
      (nodes.length - initialItemsPerPage) / itemsPerPage
    ) + 1; // 첫 페이지 포함
    setTotalPages(total);

    console.log("currentItems:", startIndex, "-", endIndex);
    console.log("totalPages:", total);
  }, [nodes, currentPage, initialItemsPerPage, itemsPerPage]);

  const pagesPerBlock = 10;

  const currentBlock = Math.ceil(currentPage / pagesPerBlock);
  const startPage = (currentBlock - 1) * pagesPerBlock + 1;
  const endPage = Math.min(startPage + pagesPerBlock - 1, totalPages);

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handleCloseAlerts = () => setAlerts([]);

  // 1. 초기 데이터 로드 및 sensorHistory 변경 감지
  useEffect(() => {
    if (!sensorHistory || sensorHistory.length === 0) return;

    const latestById = {};

    for (const record of [...sensorHistory].reverse()) {
      latestById[record.id] = {
        id: record.id,
        name: record.name,
        vibration: record.vibration,
        prob: record.prob,
        date: record.date,
        time: record.time,
        filename: record.filename,
      };
    }

    // 원하는 기준으로 정렬 (여기서는 id 기준)
    const orderedNodes = Object.values(latestById).sort((a, b) =>
      a.id.localeCompare(b.id),
    );

    setNodes(orderedNodes);
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
    <NonScrollPageContainer>
      {currentPage === 1 && (
        <>
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
                      width={90}
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
        </>
      )}

      <ChartTitle style={{ marginTop: "10px" }}>
        개별 모터 실시간 관제
      </ChartTitle>

      <RealTimeGridContainer ref={gridRef}>
        {currentItems.map((node) => {
          const isDanger = node.prob >= 70;
          const isWarning = node.prob >= 30 && node.prob < 70;
          const activeSegments = Math.floor(node.prob / 5);

          return (
            <RealTimeCard key={node.id} ref={cardRef}>
              <CardLeft>
                <MachineName>{node.name}</MachineName>
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

      {totalPages > 1 && (
        <PaginationContainer>
          <PageBtn
            onClick={() => setCurrentPage(Math.max(startPage - 1, 1))}
            disabled={startPage === 1}
          >
            &lt;&lt;
          </PageBtn>
          <PageBtn
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </PageBtn>
          {pageNumbers.map((num) => (
            <PageNum
              key={num}
              $active={currentPage === num}
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </PageNum>
          ))}
          <PageBtn
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            &gt;
          </PageBtn>
          <PageBtn
            onClick={() => setCurrentPage(Math.min(endPage + 1, totalPages))}
            disabled={endPage === totalPages}
          >
            &gt;&gt;
          </PageBtn>
        </PaginationContainer>
      )}
    </NonScrollPageContainer>
  );
}

// Styled Components (기존과 동일하므로 생략하거나 기존 내용 유지)

const NonScrollPageContainer = styled.div`
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: var(--background2);
  height: calc(100vh - 50px); /* 고정 높이 */
  display: flex;
  flex-direction: column;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChartWrapper = styled.div`
  height: 100px;
  width: 100%;
  margin-top: 10px;
  flex-grow: 1;
`;
const RealTimeGridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 열 고정 */
  grid-auto-rows: 100px;                 /* 카드 높이 고정 */
  gap: 20px;
  flex: 1 1 auto;
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
  max-width: 120px;
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
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 25px;
`;
const PageBtn = styled.button`
  padding: 2px 6px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--font);
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;
const PageNum = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid
    ${(props) => (props.$active ? "var(--main)" : "var(--border)")};
  background: ${(props) =>
    props.$active ? "var(--main)" : "var(--background)"};
  color: ${(props) => (props.$active ? "white" : "var(--font)")};
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: ${(props) =>
    props.$active ? "var(--main)" : "var(--background2)"};
  }
`;
