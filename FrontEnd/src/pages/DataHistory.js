import React, { useState, useContext, useMemo, useEffect } from "react";
import styled from "styled-components";
import {
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { NotificationContext } from "../components/Layout";

export default function DataHistory() {
  const { sensorHistory = [] } = useContext(NotificationContext);

  const [selectedDevice, setSelectedDevice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // 1. 테이블 및 KPI용 전체 필터링 로직
  const filteredHistory = useMemo(() => {
    return sensorHistory.filter((item) => {
      const matchDevice = selectedDevice === "" || item.id === selectedDevice;
      const itemDate = item.date;
      const matchDate =
        (!startDate || itemDate >= startDate) &&
        (!endDate || itemDate <= endDate);
      return matchDevice && matchDate;
    });
  }, [sensorHistory, selectedDevice, startDate, endDate]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredHistory.slice(firstIndex, lastIndex);
  }, [filteredHistory, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDevice, startDate, endDate]);

  const total = filteredHistory.length;
  const dangerCount = filteredHistory.filter((m) => m.prob >= 70).length;
  const warningCount = filteredHistory.filter(
    (m) => m.prob >= 30 && m.prob < 70,
  ).length;
  const successCount = filteredHistory.filter((m) => m.prob < 30).length;

  // 2. 그래프 전용 데이터 및 독립적 색상 계산 로직
  const chartData = useMemo(() => {
    const targetId =
      selectedDevice || (sensorHistory.length > 0 ? sensorHistory[0].id : "");

    return sensorHistory
      .filter((item) => item.id === targetId)
      .slice(0, 20)
      .reverse();
  }, [sensorHistory, selectedDevice]);

  // --- [핵심 수정 부분] 최신 데이터를 기준으로 진동/전류 고장 확률 각각 계산 ---
  const latestData = chartData[chartData.length - 1];

  // 진동 독립 확률 계산 (임계치 0.2 기준)
  const vibProb = latestData ? (latestData.vibration / 0.2) * 100 : 0;

  // 전류 독립 확률 계산 (기준값 2.1A에서 ±0.5A 이격 시 100% 위험으로 간주)
  const curProb = latestData
    ? (Math.abs(latestData.current - 2.1) / 0.5) * 100
    : 0;

  const deviceList = useMemo(() => {
    const ids = sensorHistory.map((item) => item.id);
    return [...new Set(ids)].sort();
  }, [sensorHistory]);

  const getStatusInfo = (prob) => {
    if (prob >= 70) return { text: "위험", type: "danger" };
    if (prob >= 30) return { text: "주의", type: "warning" };
    return { text: "정상", type: "success" };
  };

  return (
    <PageContainer>
      <Header>
        <div>
          <Title>데이터 예측 및 점검 이력 관리</Title>
          <Subtitle>
            실시간 수집 데이터 분석 및 AI 예측 로그 통합 저장소
          </Subtitle>
        </div>
      </Header>

      <KpiGrid>
        <KpiCard>
          <KpiLabel>조회된 데이터</KpiLabel>
          <KpiValue>{total.toLocaleString()} 건</KpiValue>
        </KpiCard>
        <KpiCard>
          <KpiLabel>정상 판정 (30% 미만)</KpiLabel>
          <KpiValue $color="var(--main)">
            {successCount.toLocaleString()} 건
          </KpiValue>
        </KpiCard>
        <KpiCard>
          <KpiLabel>주의 요망 (30% ~ 70%)</KpiLabel>
          <KpiValue $color="var(--waiting)">
            {warningCount.toLocaleString()} 건
          </KpiValue>
        </KpiCard>
        <KpiCard $isAlert={dangerCount > 0}>
          <KpiLabel>위험 감지 (70% 이상)</KpiLabel>
          <KpiValue $color="var(--error)">
            {dangerCount.toLocaleString()} 건
          </KpiValue>
        </KpiCard>
      </KpiGrid>

      <MainAnalysisGrid>
        <ChartSection>
          <SectionTitle>
            {selectedDevice
              ? `${selectedDevice} 데이터 추이`
              : "최근 수집 장비 추이 분석"}
          </SectionTitle>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "var(--font2)" }}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "var(--shadow)",
                  }}
                  labelFormatter={(value) => `측정 시간: ${value}`}
                />
                <Legend iconType="circle" />
                <ReferenceLine
                  yAxisId="right"
                  y={0.1}
                  stroke="var(--error)"
                  strokeDasharray="5 5"
                  label={{
                    value: "임계치",
                    fill: "var(--error)",
                    fontSize: 10,
                  }}
                />

                {/* [전류] : curProb가 70% 이상일 때만 var(--error) 적용 */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="current"
                  name="전류(A)"
                  fill="url(#colorCurrent)"
                  stroke={curProb >= 70 ? "var(--error)" : "var(--main)"}
                  strokeWidth={2}
                />

                {/* [진동] : vibProb가 70% 이상일 때만 var(--error) 적용. 전류 고장 여부와 무관함 */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="vibration"
                  name="진동"
                  stroke={vibProb >= 70 ? "var(--error)" : "var(--waiting)"}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartSection>
        <LogSection>
          <SectionTitle>위험 감지 타임라인</SectionTitle>
          <LogContainer>
            {filteredHistory
              .filter((item) => item.prob >= 70)
              .map((log, index) => (
                <LogBox key={index}>
                  <LogTime>
                    {log.date} {log.time}
                  </LogTime>
                  <LogText>
                    <strong>{log.id}</strong>: 진동 이상 ({log.prob}%)
                  </LogText>
                </LogBox>
              ))}
            {filteredHistory.filter((item) => item.prob >= 70).length === 0 && (
              <EmptyMsg>감지된 내역이 없습니다.</EmptyMsg>
            )}
          </LogContainer>
        </LogSection>
      </MainAnalysisGrid>

      <TableSection>
        <TableTopHeader>
          <SectionTitle style={{ marginBottom: 0 }}>
            전체 데이터 로그 이력
          </SectionTitle>
          <InnerFilterBar>
            <FilterGroup>
              <FilterLabel>장비 ID</FilterLabel>
              <FilterSelect
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                <option value="">전체 모터</option>
                {deviceList.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>조회 기간</FilterLabel>
              <DateInputGroup>
                <FormInput
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Separator>~</Separator>
                <FormInput
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </DateInputGroup>
            </FilterGroup>
            <ResetButton
              onClick={() => {
                setSelectedDevice("");
                setStartDate("");
                setEndDate("");
              }}
            >
              초기화
            </ResetButton>
          </InnerFilterBar>
        </TableTopHeader>
        <TableWrapper>
          <StyledTable>
            <thead>
              <tr>
                <Th>장비 ID</Th>
                <Th>측정 날짜</Th>
                <Th>측정 시간</Th>
                <Th>진동 수치</Th>
                <Th>전류 수치</Th>
                <Th>고장 확률</Th>
                <Th>AI 상태</Th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((motor, index) => {
                const status = getStatusInfo(motor.prob);
                return (
                  <tr key={index}>
                    <IdCell>{motor.id}</IdCell>
                    <Td>{motor.date}</Td>
                    <Td>{motor.time}</Td>
                    <VibCell $isHigh={motor.vibration >= 0.1}>
                      {motor.vibration} mm/s
                    </VibCell>
                    <Td>{motor.current} A</Td>
                    <Td>
                      <ProbContainer>
                        <BarBg>
                          <BarFill
                            $val={motor.prob}
                            $color={
                              status.type === "danger"
                                ? "var(--error)"
                                : status.type === "warning"
                                  ? "var(--waiting)"
                                  : "var(--run)"
                            }
                          />
                        </BarBg>
                        <ProbText>{motor.prob}%</ProbText>
                      </ProbContainer>
                    </Td>
                    <Td>
                      <StatusBadge $status={status.type}>
                        {status.text}
                      </StatusBadge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </StyledTable>
          {filteredHistory.length === 0 && (
            <EmptyMsg style={{ marginTop: "50px" }}>
              일치하는 데이터가 없습니다.
            </EmptyMsg>
          )}
        </TableWrapper>
        {totalPages > 1 && (
          <PaginationContainer>
            <PageBtn
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </PageBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
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
          </PaginationContainer>
        )}
      </TableSection>
    </PageContainer>
  );
}

// --- 사용자 정의 CSS (수정 금지 준수) ---
const PageContainer = styled.div`
  padding: 30px;
  background-color: var(--background2);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 25px;
`;
const Header = styled.div`
  margin-bottom: 5px;
`;
const Title = styled.h1`
  font-size: 24px;
  color: var(--font);
  font-weight: 800;
  margin: 0;
`;
const Subtitle = styled.div`
  font-size: 14px;
  color: var(--font2);
  margin-top: 5px;
`;
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
`;
const KpiCard = styled.div`
  background: var(--background);
  padding: 20px;
  border-radius: 16px;
  box-shadow: var(--shadow);
`;
const KpiLabel = styled.div`
  font-size: 15px;
  color: var(--font2);
  margin-bottom: 8px;
  font-weight: 600;
`;
const KpiValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: ${(props) => props.$color || "var(--font)"};
  margin-top: 10px;
  display: flex;
  align-items: center;
`;
const TableSection = styled.div`
  background: var(--background);
  padding: 25px;
  border-radius: 16px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
`;
const TableTopHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border);
`;
const InnerFilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;
const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const FilterLabel = styled.label`
  font-size: 13px;
  font-weight: 700;
  color: var(--font2);
  white-space: nowrap;
`;
const FilterSelect = styled.select`
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 13px;
  outline: none;
  background: var(--background);
`;
const DateInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;
const FormInput = styled.input`
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 13px;
`;
const Separator = styled.span`
  color: var(--font2);
  font-size: 12px;
`;
const ResetButton = styled.button`
  background: var(--background2);
  color: var(--font);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border);
  &:hover {
    background: var(--border);
  }
`;
const MainAnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 25px;
`;
const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 15px;
  color: var(--font);
`;
const ChartSection = styled.div`
  background: var(--background);
  padding: 20px;
  border-radius: 16px;
  box-shadow: var(--shadow);
`;
const ChartWrapper = styled.div`
  height: 300px;
`;
const LogSection = styled.div`
  background: var(--background);
  padding: 20px;
  border-radius: 16px;
  box-shadow: var(--shadow);
`;
const LogContainer = styled.div`
  height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const LogBox = styled.div`
  padding: 12px;
  background: var(--background);
  border-radius: 4px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
`;
const LogTime = styled.div`
  font-size: 10px;
  color: var(--font2);
`;
const LogText = styled.div`
  font-size: 12px;
  margin-top: 4px;
`;
const EmptyMsg = styled.div`
  color: var(--font2);
  font-size: 13px;
  text-align: center;
  margin-top: 100px;
`;
const TableWrapper = styled.div`
  max-height: 480px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }
`;
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;
const Th = styled.th`
  text-align: left;
  padding: 15px;
  background: var(--background2);
  font-size: 12px;
  color: var(--font2);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid var(--border);
`;
const Td = styled.td`
  padding: 15px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
`;
const IdCell = styled(Td)`
  font-weight: 700;
  color: var(--main);
`;
const VibCell = styled(Td)`
  color: ${(props) => (props.$isHigh ? "var(--error)" : "var(--font)")};
  font-weight: ${(props) => (props.$isHigh ? 800 : 400)};
`;
const ProbContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const ProbText = styled.span`
  font-size: 12px;
  font-weight: 700;
  min-width: 35px;
`;
const BarBg = styled.div`
  width: 80px;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
`;
const BarFill = styled.div`
  height: 100%;
  width: ${(props) => props.$val}%;
  background: ${(props) => props.$color};
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  background-color: ${(props) =>
    props.$status === "danger"
      ? "var(--bgError)"
      : props.$status === "warning"
        ? "var(--bgWaiting)"
        : "var(--bgRun)"};
  color: ${(props) =>
    props.$status === "danger"
      ? "var(--error)"
      : props.$status === "warning"
        ? "var(--waiting)"
        : "var(--run)"};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 25px;
`;
const PageBtn = styled.button`
  padding: 6px 12px;
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
