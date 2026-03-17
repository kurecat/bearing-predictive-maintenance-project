import React, { useState } from "react";
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

// 테이블용 가상 데이터
const initialMotors = [
  { id: "M-101", vibration: 0.02, current: 2.1, prob: 2, label: 0 },
  { id: "M-102", vibration: 0.03, current: 2.2, prob: 5, label: 0 },
  { id: "M-103", vibration: 0.18, current: 3.4, prob: 92, label: 1 },
];

// 그래프용 가상 데이터
const dummyChartData = [
  { time: "09:00", vibration: 0.02, current: 2.1 },
  { time: "10:00", vibration: 0.03, current: 2.2 },
  { time: "11:00", vibration: 0.05, current: 2.5 },
  { time: "12:00", vibration: 0.08, current: 2.8 },
  { time: "13:00", vibration: 0.12, current: 3.0 },
  { time: "14:00", vibration: 0.18, current: 3.4 },
];

export default function DataHistory() {
  const [motorData, setMotorData] = useState(initialMotors);
  const [chartData, setChartData] = useState(dummyChartData);
  const [alertLogs, setAlertLogs] = useState([
    {
      time: "10:15:22",
      message: "M-103 모터 진동 이상 감지 (고장 확률 92%)",
    },
  ]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processCSVFile(files[0]);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) processCSVFile(files[0]);
  };

  const processCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter((line) => line.trim() !== "");

      const newMotors = [];
      const newLogs = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length >= 2) {
          const v = parseFloat(cols[0]);
          const c = parseFloat(cols[1]);

          let probability = 5;
          let newLabel = 0;

          if (v >= 0.1) {
            probability = Math.floor(Math.random() * 20) + 80;
            newLabel = 1;
          }

          const id = `M-${Math.floor(Math.random() * 900) + 100}`;
          newMotors.push({
            id,
            vibration: v,
            current: c,
            prob: probability,
            label: newLabel,
          });

          if (newLabel === 1) {
            const now = new Date();
            const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
            newLogs.push({
              time: timeString,
              message: `${id} 모터 이상 징후 감지! (고장 확률 ${probability}%)`,
            });
          }
        }
      }

      setMotorData((prev) => [...prev, ...newMotors]);
      if (newLogs.length > 0) setAlertLogs((prev) => [...newLogs, ...prev]);
    };
    reader.readAsText(file);
  };

  const total = motorData.length;
  const faults = motorData.filter((m) => m.label === 1).length;

  return (
    <PageContainer>
      <Header>
        <div>
          <Title>데이터 예측 및 점검 이력 관리</Title>
          <Subtitle>CSV 데이터 업로드 및 개별 예측 로그 조회</Subtitle>
        </div>
      </Header>

      <LayoutGrid>
        <LeftPanel>
          <FilterCard>
            <div>
              <CardTitle>특정 장비 이력 조회</CardTitle>
              <FormGroup>
                <FormLabel>모터 ID 선택</FormLabel>
                <FormSelect>
                  <option value="">모터를 선택하세요 (ex: M-101)</option>
                  <option value="M-101">M-101 (컨베이어)</option>
                  <option value="M-102">M-102 (조립로봇)</option>
                  <option value="M-103">M-103 (냉각팬)</option>
                </FormSelect>
              </FormGroup>
              <FormGroup>
                <FormLabel>시작 날짜</FormLabel>
                <FormInput type="date" />
              </FormGroup>
              <FormGroup>
                <FormLabel>종료 날짜</FormLabel>
                <FormInput type="date" />
              </FormGroup>
            </div>
            <SearchButton
              onClick={() =>
                alert(
                  "백엔드 API (GET /api/current_history 등) 연동 예정입니다.",
                )
              }
            >
              과거 이력 데이터 조회
            </SearchButton>
          </FilterCard>
        </LeftPanel>

        <RightPanel>
          <ChartCard>
            <CardTitle>과거 센서 복합 데이터 추이 (전류 및 진동)</CardTitle>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorCurrent"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--font2)" }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--font2)" }}
                    dx={-10}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--font2)" }}
                    dx={10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow)",
                      fontSize: "13px",
                      color: "var(--font)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: "13px",
                      color: "var(--font2)",
                      paddingTop: "20px",
                    }}
                    iconType="circle"
                  />
                  <ReferenceLine
                    yAxisId="right"
                    y={0.1}
                    stroke="var(--error)"
                    strokeDasharray="4 4"
                    label={{
                      position: "insideTopLeft",
                      value: "위험 임계치 (0.1)",
                      fill: "var(--error)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="current"
                    name="전류량 (A)"
                    fillOpacity={1}
                    fill="url(#colorCurrent)"
                    stroke="var(--main)"
                    strokeWidth={3}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="vibration"
                    name="진동 수치 (mm/s)"
                    stroke="var(--error)"
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    activeDot={{
                      r: 6,
                      fill: "var(--error)",
                      stroke: "var(--background)",
                      strokeWidth: 2,
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </ChartCard>
        </RightPanel>
      </LayoutGrid>

      <LayoutGrid>
        <LeftPanel>
          <Card>
            <CardTitle>센서 이력 데이터 일괄 업로드 (CSV)</CardTitle>
            <DropZone
              $isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileInput
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
              <DropText>클릭하거나 CSV 파일을 이곳에 드롭하세요</DropText>
              <DropSubText>형식: vibration, current</DropSubText>
            </DropZone>
          </Card>

          <Card>
            <CardTitle>업로드 데이터 분석 로그</CardTitle>
            <LogContainer>
              {alertLogs.map((log, index) => (
                <LogBox key={index}>
                  <LogTime>{log.time}</LogTime>
                  <LogText>{log.message}</LogText>
                </LogBox>
              ))}
              {alertLogs.length === 0 && (
                <EmptyLogMessage>감지된 위험 내역이 없습니다.</EmptyLogMessage>
              )}
            </LogContainer>
          </Card>
        </LeftPanel>

        <RightPanel>
          <KpiRow>
            <KpiBox>
              <KpiLabel>분석 완료 모터</KpiLabel>
              <KpiValue>{total} 대</KpiValue>
            </KpiBox>
            <KpiBox>
              <KpiLabel>정상 가동</KpiLabel>
              <KpiValue $color="var(--main)">{total - faults} 대</KpiValue>
            </KpiBox>
            <KpiBox>
              <KpiLabel>고장 위험</KpiLabel>
              <KpiValue $color="var(--error)">{faults} 대</KpiValue>
            </KpiBox>
          </KpiRow>

          <TableCard>
            <CardTitle>업로드 데이터 분석 상세 현황</CardTitle>
            <TableWrapper>
              <StyledTable>
                <thead>
                  <tr>
                    <Th>모터 ID</Th>
                    <Th>진동 (임계치 0.1)</Th>
                    <Th>전류</Th>
                    <Th>고장 확률</Th>
                    <Th>AI 판정</Th>
                  </tr>
                </thead>
                <tbody>
                  {motorData.map((motor, index) => {
                    const isDanger = motor.prob >= 70;
                    const isWarning = motor.prob >= 30 && motor.prob < 70;
                    const probColor = isDanger
                      ? "var(--error)"
                      : isWarning
                        ? "var(--waiting)"
                        : "var(--run)";

                    return (
                      <tr key={index}>
                        <IdCell>{motor.id}</IdCell>
                        <VibrationCell $isHigh={motor.vibration >= 0.1}>
                          {motor.vibration}
                        </VibrationCell>
                        <Td>{motor.current} A</Td>
                        <Td>
                          <ProbWrapper>
                            <BarBg>
                              <BarFill $val={motor.prob} $color={probColor} />
                            </BarBg>
                            <ProbText $color={probColor}>
                              {motor.prob}%
                            </ProbText>
                          </ProbWrapper>
                        </Td>
                        <Td>
                          <StatusBadge $isFault={motor.label === 1}>
                            {motor.label === 1 ? "위험 (1)" : "정상 (0)"}
                          </StatusBadge>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </StyledTable>
            </TableWrapper>
          </TableCard>
        </RightPanel>
      </LayoutGrid>
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  width: 100%;
`;

const Title = styled.h1`
  font-size: var(--fontTitle, 26px);
  color: var(--font);
  font-weight: 800;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.div`
  font-size: var(--fontSm);
  color: var(--font2);
  margin: 0;
`;

const LayoutGrid = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  width: 100%;
  align-items: stretch;
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightPanel = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FilterCard = styled.div`
  background-color: var(--background);
  padding: 20px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const ChartCard = styled.div`
  background-color: var(--background);
  padding: 20px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  box-sizing: border-box;
  height: 100%;
`;

const ChartWrapper = styled.div`
  height: 300px;
  width: 100%;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: var(--fontXs);
  color: var(--font2);
  font-weight: var(--bold);
  margin-bottom: 8px;
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: var(--fontSm);
  background-color: var(--background);
  color: var(--font);
  box-sizing: border-box;
  outline: none;

  &:focus {
    border-color: var(--main);
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: var(--fontSm);
  background-color: var(--background);
  color: var(--font);
  box-sizing: border-box;

  &:focus {
    border-color: var(--main);
  }
`;

const SearchButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: var(--main);
  color: var(--font3);
  border: none;
  border-radius: 8px;
  font-size: var(--fontSm);
  font-weight: var(--bold);
  margin-top: 10px;

  &:hover {
    opacity: 0.9;
  }
`;

const Card = styled.div`
  background-color: var(--background);
  padding: 20px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  box-sizing: border-box;
`;

const CardTitle = styled.h2`
  font-size: var(--fontLg);
  color: var(--font);
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
  margin: 0 0 15px 0;
  font-weight: var(--bold);
`;

const DropZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  border: 2px dashed
    ${(props) => (props.$isDragging ? "var(--main)" : "var(--border)")};
  background-color: ${(props) =>
    props.$isDragging ? "#eff6ff" : "var(--background)"};
  border-radius: 8px;
  padding: 30px 20px;
  color: var(--font2);
  cursor: pointer;
  transition: all 0.3s ease;
`;

const FileInput = styled.input`
  display: none;
`;

const DropText = styled.div`
  font-size: var(--fontSm);
  font-weight: var(--bold);
  color: var(--font);
  margin-bottom: 5px;
`;

const DropSubText = styled.div`
  font-size: var(--fontXs);
  color: var(--font2);
`;

const LogContainer = styled.div`
  max-height: 250px;
  overflow-y: auto;
`;

const LogBox = styled.div`
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  border-bottom: 1px solid var(--border);
`;

const LogTime = styled.div`
  font-size: var(--fontXxs);
  color: var(--font2);
  margin-bottom: 3px;
`;

const LogText = styled.p`
  font-size: var(--fontXs);
  color: var(--error);
  margin: 0;
`;

const EmptyLogMessage = styled.div`
  font-size: var(--fontXs);
  color: var(--font2);
`;

const KpiRow = styled.div`
  display: flex;
  gap: 15px;
  width: 100%;
`;

const KpiBox = styled.div`
  flex: 1;
  padding: 15px;
  border-radius: 8px;
  background-color: ${(props) => props.$bg || "var(--background)"};
  text-align: center;
  border: 1px solid ${(props) => props.$borderColor || "var(--border)"};
  box-shadow: var(--shadow);
`;

const KpiLabel = styled.div`
  font-size: var(--fontXs);
  color: ${(props) => props.$color || "var(--font2)"};
`;

const KpiValue = styled.div`
  font-size: 28px;
  font-weight: var(--bold);
  color: ${(props) => props.$color || "var(--font)"};
  margin: 5px 0 0 0;
`;

const TableCard = styled(Card)`
  flex: 1;
`;

const TableWrapper = styled.div`
  max-height: 350px;
  overflow-y: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

const Th = styled.th`
  padding: 12px;
  background-color: var(--background2);
  color: var(--font2);
  font-size: var(--fontXs);
  border-bottom: 2px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 1;
`;

const Td = styled.td`
  padding: 12px;
  color: var(--font);
  font-size: var(--fontSm);
  border-bottom: 1px solid var(--border);
`;

const IdCell = styled(Td)`
  font-weight: var(--bold);
`;

const VibrationCell = styled(Td)`
  color: ${(props) => (props.$isHigh ? "var(--error)" : "var(--font)")};
  font-weight: ${(props) => (props.$isHigh ? "var(--bold)" : "var(--normal)")};
`;

const ProbWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProbText = styled.span`
  color: ${(props) => props.$color};
  font-weight: var(--bold);
  font-size: var(--fontXs);
`;

const StatusBadge = styled.span`
  padding: 5px 10px;
  border-radius: 20px;
  font-size: var(--fontXs);
  font-weight: var(--bold);
  background-color: ${(props) =>
    props.$isFault ? "var(--bgError)" : "var(--bgRun)"};
  color: ${(props) => (props.$isFault ? "var(--error)" : "var(--run)")};
`;

const BarBg = styled.div`
  width: 100px;
  height: 6px;
  background-color: var(--border);
  border-radius: 3px;
  overflow: hidden;
`;

const BarFill = styled.div`
  width: ${(props) => props.$val}%;
  height: 100%;
  background-color: ${(props) => props.$color};
`;
