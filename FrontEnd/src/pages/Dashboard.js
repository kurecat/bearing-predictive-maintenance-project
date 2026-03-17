import React, { useState } from "react";
import styled from "styled-components";
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

// 시계열 가상 데이터
const timeSeriesData = [
  { time: "09:00", vibration: 0.02, current: 2.1, prob: 5 },
  { time: "10:00", vibration: 0.03, current: 2.2, prob: 8 },
  { time: "11:00", vibration: 0.05, current: 2.5, prob: 15 },
  { time: "12:00", vibration: 0.08, current: 2.8, prob: 45 },
  { time: "13:00", vibration: 0.12, current: 3.0, prob: 65 },
  { time: "14:00", vibration: 0.18, current: 3.4, prob: 88 },
  { time: "15:00", vibration: 0.19, current: 3.5, prob: 95 },
  { time: "16:00", vibration: 0.04, current: 2.3, prob: 10 },
];

// 모터별 평균 위험도 데이터 (순위용)
const equipmentRiskData = [
  { name: "M-103 (냉각팬)", avgProb: 82 },
  { name: "M-104 (포장기)", avgProb: 45 },
  { name: "M-105 (프레스)", avgProb: 25 },
  { name: "M-101 (컨베이어)", avgProb: 15 },
  { name: "M-102 (조립로봇)", avgProb: 8 },
];

// 모터 상태 비율 (도넛 차트용)
const statusRatioData = [
  { name: "정상 가동", value: 32, color: "var(--run)" },
  { name: "주의 요망", value: 8, color: "var(--waiting)" },
  { name: "위험 상태", value: 3, color: "var(--error)" },
];

export default function Dashboard() {
  const [history] = useState(timeSeriesData);
  const [riskData] = useState(equipmentRiskData);
  const [statusData] = useState(statusRatioData);

  const totalMotors = statusData.reduce((acc, cur) => acc + cur.value, 0);
  const normalMotors = statusData[0].value;
  const warningMotors = statusData[1].value;
  const dangerMotors = statusData[2].value;

  return (
    <PageContainer>
      <HeaderContainer>
        <div>
          <PageTitle>종합 통계 대시보드</PageTitle>
          <PageSubtitle>설비 가동 현황 및 AI 예측 통계 요약</PageSubtitle>
        </div>
      </HeaderContainer>

      <KpiGrid>
        <KpiCard>
          <KpiLabel>전체 모터 대수</KpiLabel>
          <KpiValue>{totalMotors} 대</KpiValue>
          <KpiSubText>현재 시스템에 등록된 장비</KpiSubText>
        </KpiCard>
        <KpiCard>
          <KpiLabel>정상 가동</KpiLabel>
          <KpiValue $color="var(--main)">{normalMotors} 대</KpiValue>
          <KpiSubText>안정적 가동 중 (위험도 30% 미만)</KpiSubText>
        </KpiCard>
        <KpiCard>
          <KpiLabel>주의 요망</KpiLabel>
          <KpiValue $color="var(--waiting)">{warningMotors} 대</KpiValue>
          <KpiSubText>예방 점검 권장 (위험도 30%~70%)</KpiSubText>
        </KpiCard>
        <KpiCard>
          <KpiLabel>위험 상태</KpiLabel>
          <KpiValue $color="var(--error)">{dangerMotors} 대</KpiValue>
          <KpiSubText>즉시 조치 필요 (위험도 70% 이상)</KpiSubText>
        </KpiCard>
      </KpiGrid>

      <ChartGrid>
        <ChartCard $flex={1}>
          <ChartTitle>전체 모터 상태 비율</ChartTitle>
          <ChartWrapper style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
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
                  itemStyle={{ fontWeight: "var(--bold)" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "13px",
                    fontWeight: "var(--bold)",
                    color: "var(--font2)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartCard>

        <ChartCard $flex={2}>
          <ChartTitle>고위험 모터 TOP 5 (평균 예측 위험도)</ChartTitle>
          <ChartWrapper style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                layout="vertical"
                data={riskData}
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={false}
                  stroke="var(--border)"
                />
                <XAxis type="number" hide />
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
                  width={110}
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
                  name="평균 위험 확률(%)"
                  fill="var(--main)"
                  radius={[0, 8, 8, 0]}
                  barSize={20}
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
      </ChartGrid>

      <ChartGrid>
        <ChartCard $flex={1}>
          <ChartTitle>
            시간별 센서 복합 데이터 추이 (평균 전류 및 진동)
          </ChartTitle>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={history}
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
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
                  tick={{
                    fontSize: 12,
                    fill: "var(--font2)",
                    fontWeight: "var(--medium)",
                  }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "var(--font2)",
                    fontWeight: "var(--medium)",
                  }}
                  domain={["auto", "auto"]}
                  dx={-10}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "var(--font2)",
                    fontWeight: "var(--medium)",
                  }}
                  dx={10}
                />
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
                  itemStyle={{ fontWeight: "var(--bold)" }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "13px",
                    fontWeight: "var(--bold)",
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
                    fontWeight: "var(--bold)",
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="current"
                  name="평균 전류량 (A)"
                  fillOpacity={1}
                  fill="url(#colorCurrent)"
                  stroke="var(--main)"
                  strokeWidth={3}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="vibration"
                  name="평균 진동 수치 (mm/s)"
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
      </ChartGrid>

      <TableCard>
        <TableHeader>
          <ChartTitle style={{ marginBottom: 0 }}>
            센서 로우 데이터 및 예측 이력 상세
          </ChartTitle>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            총 {history.length}건의 기록
          </div>
        </TableHeader>
        <Table>
          <thead>
            <tr>
              <Th>측정 시간</Th>
              <Th>진동 (Threshold: 0.1)</Th>
              <Th>전류 (A)</Th>
              <Th>AI 고장 예측 확률</Th>
              <Th>최종 상태 판정</Th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr key={i}>
                <Td $weight="600" $color="#0f172a">
                  {row.time}
                </Td>
                <Td
                  $color={row.vibration >= 0.1 ? "var(--error)" : "var(--font)"}
                  $weight={row.vibration >= 0.1 ? "var(--bold)" : "normal"}
                >
                  {row.vibration}
                </Td>
                <Td>{row.current}</Td>
                <Td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "var(--bold)",
                        color:
                          row.prob >= 80
                            ? "var(--error)"
                            : row.prob >= 50
                              ? "var(--waiting)"
                              : "var(--font)",
                      }}
                    >
                      {row.prob}%
                    </span>
                  </div>
                </Td>
                <Td>
                  <StatusBadge $prob={row.prob}>
                    {row.prob >= 80
                      ? "위험 (조치 요망)"
                      : row.prob >= 50
                        ? "주의 (관찰 필요)"
                        : "정상 가동"}
                  </StatusBadge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
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

const PageTitle = styled.h1`
  font-size: var(--fontTitle);
  color: var(--font);
  font-weight: 800;
  margin: 0 0 8px 0;
`;

const PageSubtitle = styled.p`
  font-size: 14px;
  color: var(--font2);
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const BtnOutline = styled.button`
  padding: 8px 16px;
  background-color: var(--background);
  color: var(--font);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    background-color: var(--background2);
  }
`;

const BtnPrimary = styled.button`
  padding: 8px 16px;
  background-color: var(--main);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  &:hover {
    opacity: 0.9;
  }
`;

const FilterCard = styled.div`
  background-color: var(--background);
  padding: 20px;
  border-radius: 10px;
  box-shadow: var(--shadow);
  margin-bottom: 24px;
  display: flex;
  gap: 20px;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 13px;
  color: var(--font2);
  font-weight: 600;
`;

const FilterSelect = styled.select`
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 14px;
  color: var(--font);
  background-color: var(--background);
  width: 200px;
  outline: none;

  &:focus {
    border-color: var(--main);
  }
`;

const FilterSearchBtn = styled.button`
  padding: 10px 24px;
  background-color: var(--main);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  align-self: flex-end;

  &:hover {
    opacity: 0.9;
  }
`;

const KpiGrid = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
`;

const KpiCard = styled.div`
  flex: 1;
  background-color: var(--background);
  padding: 24px;
  border-radius: 10px;
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
  color: ${(props) => props.$color || "var(--font)"};
  font-weight: 800;
`;

const KpiSubText = styled.div`
  font-size: 12px;
  color: var(--font2);
  margin-top: 8px;
`;

const ChartGrid = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  align-items: stretch;
`;

const ChartCard = styled.div`
  flex: ${(props) => props.$flex || 1};
  background-color: var(--background);
  padding: 24px;
  border-radius: 10px;
  box-shadow: var(--shadow);
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const ChartTitle = styled.h2`
  font-size: 16px;
  color: var(--font);
  font-weight: 800;
  margin-bottom: 20px;
  margin-top: 0;
`;

const ChartWrapper = styled.div`
  height: 300px;
  width: 100%;
  margin-top: 10px;
  flex-grow: 1;
`;

const TableCard = styled.div`
  background-color: var(--background);
  padding: 24px;
  border-radius: 10px;
  box-shadow: var(--shadow);
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

const Th = styled.th`
  padding: 14px 16px;
  background-color: var(--background2);
  color: var(--font2);
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
`;

const Td = styled.td`
  padding: 16px;
  color: ${(props) => props.$color || "var(--font)"};
  font-size: 14px;
  border-bottom: 1px solid var(--background2);
  font-weight: ${(props) => props.$weight || "normal"};
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
  background-color: ${(props) =>
    props.$prob >= 80
      ? "var(--bgError)"
      : props.$prob >= 50
        ? "#fef3c7"
        : "var(--bgRun)"};
  color: ${(props) =>
    props.$prob >= 80
      ? "var(--error)"
      : props.$prob >= 50
        ? "var(--waiting)"
        : "var(--run)"};
`;
