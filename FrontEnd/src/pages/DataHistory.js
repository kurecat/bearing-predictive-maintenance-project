import React, { useState, useContext, useMemo, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import axiosApi from "../api/AxiosApi";
import {
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

const CHART_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
];

export default function DataHistory() {
  const [sensorHistory, setSensorHistory] = useState([]);

  const [selectedDevice, setSelectedDevice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const pagesPerBlock = 10;

  const [hiddenLines, setHiddenLines] = useState({});

  const filteredHistory = useMemo(() => {
    return sensorHistory.filter((item) => {
      const matchDevice = selectedDevice === "" || item.name === selectedDevice;
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
  const fetchAllDeviceHistories = async () => {
    try {
      const devices = await axiosApi.get("/devices");
      const allHistories = await Promise.all(
        devices.map(async (device) => {
          const history = await axiosApi.get(`/devices/${device._id}/vibration`);
          return history.map((h) => {
            const historyFormat = {
              id: h._id,
              name: h.device.alias ?? h.device.motor_spec.model,
              date: h.metadata.date.split(" ")[0],
              time: h.metadata.date.split(" ")[1],
              vibration: h.rms[0],
              prob: (h.metadata.prob * 100).toFixed(0), // 0~1 -> 0~100%
              filename: h.metadata.filename,
            };
            return historyFormat;
          });
        })
      );
      const merged = allHistories.flat();
      console.log("Fetched device histories:", merged);
      setSensorHistory(merged);
    } catch (err) {
      console.error("Failed to fetch device histories:", err);
    }
  };

    fetchAllDeviceHistories();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDevice, startDate, endDate]);

  const deviceList = useMemo(() => {
    const names = sensorHistory.map((item) => item.name);
    return [...new Set(names)].sort();
  }, [sensorHistory]);

  // 필터 조건이 바뀌면 숨겨진 선 상태를 초기화
  useEffect(() => {
    if (!selectedDevice) {
      // 전체 장비 조회 시: 평균선은 보이고, 개별 모터 선은 모두 숨김
      const initialHidden = {};
      deviceList.forEach((name) => {
        initialHidden[name] = true;
      });
      initialHidden["average"] = false;
      setHiddenLines(initialHidden);
    } else {
      // 특정 장비 1개 조회 시: 모두 보이게 초기화
      setHiddenLines({});
    }
  }, [selectedDevice, deviceList]);

  const currentBlock = Math.ceil(currentPage / pagesPerBlock);
  const startPage = (currentBlock - 1) * pagesPerBlock + 1;
  const endPage = Math.min(startPage + pagesPerBlock - 1, totalPages);

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const total = filteredHistory.length;
  const dangerCount = filteredHistory.filter((m) => m.prob >= 70).length;
  const warningCount = filteredHistory.filter(
    (m) => m.prob >= 30 && m.prob < 70,
  ).length;
  const successCount = filteredHistory.filter((m) => m.prob < 30).length;

  // 차트 데이터 20개 (가장 최신 데이터부터) + 분 단위 평균 및 전체 평균 추가
  const chartData = useMemo(() => {
    const grouped = {};

    filteredHistory.forEach((item) => {
      const timeParts = item.time.split(":");
      const minuteTime =
        timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : item.time;

      if (!grouped[minuteTime]) {
        grouped[minuteTime] = {
          time: minuteTime,
          count: { total: 0 },
          totalVibration: 0,
        };
      }

      // 개별 모터별 누적
      if (!grouped[minuteTime][item.name]) {
        grouped[minuteTime][item.name] = 0;
        grouped[minuteTime].count[item.name] = 0;
      }
      grouped[minuteTime][item.name] += item.vibration;
      grouped[minuteTime].count[item.name] += 1;

      // 전체 모터 누적 (평균선 계산용)
      grouped[minuteTime].totalVibration += item.vibration;
      grouped[minuteTime].count.total += 1;
    });

    const averagedData = Object.values(grouped).map((group) => {
      const result = { time: group.time };
      // 전체 평균 계산
      result.average = parseFloat(
        (group.totalVibration / group.count.total).toFixed(3),
      );

      // 개별 모터 평균 계산
      deviceList.forEach((name) => {
        if (group[name] !== undefined) {
          result[name] = parseFloat(
            (group[name] / group.count[name]).toFixed(3),
          );
        }
      });
      return result;
    });

    return averagedData.slice(-20);
  }, [filteredHistory, deviceList]);

  const getStatusInfo = (prob) => {
    if (prob >= 70) return { text: "고장", type: "danger" };
    if (prob >= 30) return { text: "위험", type: "warning" };
    return { text: "정상", type: "success" };
  };

  // 범례 클릭 시 선 보이기/숨기기 토글 함수
  const handleLegendClick = (e) => {
    setHiddenLines((prev) => ({
      ...prev,
      [e.dataKey]: !prev[e.dataKey], // 기존 상태를 반전시킴 (true -> false, false -> true)
    }));
  };

  return (
    <PageContainer>
      <Header>
        <div>
          <Title>데이터 로그 관리</Title>
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
          <KpiLabel>위험 감지 (30% ~ 70%)</KpiLabel>
          <KpiValue $color="var(--waiting)">
            {warningCount.toLocaleString()} 건
          </KpiValue>
        </KpiCard>
        <KpiCard $isAlert={dangerCount > 0}>
          <KpiLabel>고장 감지 (70% 이상)</KpiLabel>
          <KpiValue $color="var(--error)">
            {dangerCount.toLocaleString()} 건
          </KpiValue>
        </KpiCard>
      </KpiGrid>

      <MainAnalysisGrid>
        <ChartSection>
          <SectionTitle>
            {selectedDevice
              ? `${selectedDevice} 진동 데이터 추이 (분 단위 평균)`
              : "전체 장비 진동 추이 분석 (분 단위 평균)"}
          </SectionTitle>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "var(--font2)" }}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={["auto", "auto"]}
                  // {[0, (dataMax) => Math.max(dataMax, 0.25)]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "var(--shadow)",
                  }}
                  labelFormatter={(value) => `측정 시간: ${value} (평균)`}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    paddingTop: "10px",
                    cursor: "pointer",
                  }}
                  onClick={handleLegendClick} // 클릭 이벤트 추가
                  formatter={(value, entry) => (
                    // 클릭하여 숨긴 상태면 범례 글씨 색을 흐리게 처리
                    <span
                      style={{
                        color: hiddenLines[entry.dataKey]
                          ? "#cbd5e1"
                          : "var(--font2)",
                      }}
                    >
                      {value}
                    </span>
                  )}
                />

                {/* <ReferenceLine
                  y={0.02}
                  stroke="var(--main)"
                  strokeDasharray="4 4"
                  label={{
                    value: "정상 패턴 (0.02)",
                    fill: "var(--main)",
                    fontSize: 10,
                    position: "insideBottomLeft",
                  }}
                />

                <ReferenceLine
                  y={0.1}
                  stroke="var(--waiting)"
                  strokeDasharray="4 4"
                  label={{
                    value: "위험 임계점 (0.10)",
                    fill: "var(--waiting)",
                    fontSize: 10,
                    position: "insideTopLeft",
                  }}
                />

                <ReferenceLine
                  y={0.2}
                  stroke="var(--error)"
                  strokeDasharray="4 4"
                  label={{
                    value: "고장 임계점 (0.20)",
                    fill: "var(--error)",
                    fontSize: 10,
                    position: "insideTopLeft",
                  }}
                /> */}

                {selectedDevice ? (
                  <Line
                    type="monotone"
                    dataKey="average" // 선택된 경우에도 평균값(단일 모터값) 활용
                    name="현재 진동 수치(mm/s)"
                    stroke="var(--font)" // 단일 조회 시 색상 통일
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="average"
                      name="전체 평균"
                      stroke="var(--font)"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                      hide={hiddenLines["average"]}
                    />
                    {deviceList.map((name, index) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        name={name}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                        hide={hiddenLines[name]}
                      />
                    ))}
                  </>
                )}
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
                    <span style={{ fontWeight: 700 }}>{log.name}</span>: 진동
                    이상 ({log.prob}%)
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
                {deviceList.map((name) => (
                  <option key={name} value={name}>
                    {name}
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
                <Th>장비명</Th>
                <Th>측정 날짜</Th>
                <Th>측정 시간</Th>

                <Th style={{ color: "var(--main)" }}>
                  정상 패턴
                  <br />
                  (mm/s)
                </Th>
                <Th style={{ color: "var(--waiting)" }}>
                  위험 임계점
                  <br />
                  (mm/s)
                </Th>
                <Th style={{ color: "var(--error)" }}>
                  고장 임계점 <br />
                  (mm/s)
                </Th>
                <Th style={{ color: "var(--font)" }}>
                  진동 측정값
                  <br />
                  (mm/s)
                </Th>
                <Th>고장 확률</Th>
                <Th>AI 판정</Th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((motor, index) => {
                const status = getStatusInfo(motor.prob);
                return (
                  <tr key={index}>
                    <IdCell>{motor.name}</IdCell>
                    <Td>{motor.date}</Td>
                    <Td>{motor.time}</Td>
                    <Td style={{ color: "var(--main)", fontWeight: 700 }}>
                      0.02
                    </Td>
                    <Td style={{ color: "var(--waiting)", fontWeight: 700 }}>
                      0.10
                    </Td>
                    <Td style={{ color: "var(--error)", fontWeight: 700 }}>
                      0.20
                    </Td>
                    <VibCell
                      $isHigh={motor.vibration >= 0.1}
                      style={{ fontWeight: 700 }}
                    >
                      {motor.vibration}
                    </VibCell>
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
      </TableSection>
    </PageContainer>
  );
}

const PageContainer = styled.div`
  padding: 20px;
  background-color: var(--background2);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
const Header = styled.div`
  margin-bottom: 5px;
`;
const Title = styled.h2`
  font-size: var(--fontTitle);
  color: var(--font);
  font-weight: var(--titleBold);
  margin: 0 0 8px 0;
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
  font-size: 22px;
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
  text-align: center;
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
  text-align: center;
  padding: 15px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
`;
const IdCell = styled(Td)`
  font-weight: 700;
  color: var(--font);
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
