import React, { useState } from "react";
import styled from "styled-components";
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 현업 수준의 풍부한 가상 데이터 (온도 제외)
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

// 모터별 평균 위험도 데이터 (Bar 차트용)
const equipmentRiskData = [
  { name: "M-101 (컨베이어)", avgProb: 15 },
  { name: "M-102 (조립로봇)", avgProb: 8 },
  { name: "M-103 (냉각팬)", avgProb: 82 },
  { name: "M-104 (포장기)", avgProb: 45 },
  { name: "M-105 (프레스)", avgProb: 25 },
];

export default function Report() {
  const [history] = useState(timeSeriesData);
  const [riskData] = useState(equipmentRiskData);

  // 최고 진동 및 최고 위험도 계산 (온도 대신 진동으로 변경)
  const maxVibration = Math.max(...history.map((d) => d.vibration));
  const maxProb = Math.max(...history.map((d) => d.prob));
  const dangerCount = history.filter((d) => d.prob >= 80).length;

  return (
    <PageContainer>
      <HeaderContainer>
        <div>
          <PageTitle>모터 종합 분석 리포트</PageTitle>
          <PageSubtitle>
            과거 센서 데이터 추이 및 AI 고장 예측 이력 분석
          </PageSubtitle>
        </div>
        <ButtonGroup>
          <BtnOutline>엑셀 다운로드 (CSV)</BtnOutline>
          <BtnPrimary>PDF 보고서 출력</BtnPrimary>
        </ButtonGroup>
      </HeaderContainer>

      <FilterCard>
        <FilterGroup>
          <FilterLabel>조회 기간</FilterLabel>
          <FilterSelect>
            <option>최근 24시간</option>
            <option>최근 7일</option>
            <option>최근 30일</option>
            <option>사용자 지정 날짜...</option>
          </FilterSelect>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>대상 모터 그룹</FilterLabel>
          <FilterSelect>
            <option>전체 모터</option>
            <option>A동 라인 (컨베이어)</option>
            <option>B동 라인 (프레스)</option>
            <option>고위험군 (Label 1) 모터만</option>
          </FilterSelect>
        </FilterGroup>
        <BtnPrimary style={{ alignSelf: "flex-end", padding: "10px 24px" }}>
          조회하기
        </BtnPrimary>
      </FilterCard>

      <KpiGrid>
        <KpiCard>
          <KpiLabel>조회 기간 내 최고 진동 수치</KpiLabel>
          <KpiValue>{maxVibration} mm/s</KpiValue>
          <KpiSubText>임계치(0.1) 초과 이력 있음</KpiSubText>
        </KpiCard>
        <KpiCard>
          <KpiLabel>AI 최고 예측 고장 확률</KpiLabel>
          <KpiValue $color="#dc2626">{maxProb} %</KpiValue>
          <KpiSubText>15:00 기준 최고치 기록</KpiSubText>
        </KpiCard>
        <KpiCard>
          <KpiLabel>위험 감지 횟수 (80% 이상)</KpiLabel>
          <KpiValue $color="#dc2626">{dangerCount} 회</KpiValue>
          <KpiSubText>즉시 점검 권고 수준</KpiSubText>
        </KpiCard>
      </KpiGrid>

      <ChartGrid>
        {/* 라인 차트: 진동 변화 추이 */}
        <ChartCard $flex={2}>
          <ChartTitle>센서 진동 추이</ChartTitle>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "13px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "13px", paddingTop: "10px" }}
                />
                <Line
                  type="monotone"
                  dataKey="vibration"
                  name="진동 수치 (mm/s)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 바 차트: 모터별 위험도 비교 */}
        <ChartCard $flex={1}>
          <ChartTitle>모터별 평균 위험도 누적 현황</ChartTitle>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                layout="vertical"
                data={riskData}
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "13px",
                  }}
                />
                <Bar
                  dataKey="avgProb"
                  name="평균 위험 확률(%)"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </ChartGrid>

      {/* 상세 이력 테이블 */}
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
                  $color={row.vibration >= 0.1 ? "#ef4444" : "#334155"}
                  $weight={row.vibration >= 0.1 ? "800" : "normal"}
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
                        fontWeight: "800",
                        color:
                          row.prob >= 80
                            ? "#dc2626"
                            : row.prob >= 50
                              ? "#d97706"
                              : "#334155",
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
`;

const PageSubtitle = styled.p`
  font-size: 14px;
  color: var(--font2, #64748b);
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const BtnOutline = styled.button`
  padding: 8px 16px;
  background-color: var(--background, white);
  color: var(--font, #334155);
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    background-color: var(--background2, #f8fafc);
  }
`;

const BtnPrimary = styled.button`
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    background-color: #2563eb;
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
  color: var(--font, #334155);
  background-color: var(--background);
  width: 200px;
  outline: none;

  &:focus {
    border-color: #3b82f6;
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
  font-size: 13px;
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
  color: var(--font2, #94a3b8);
  margin-top: 8px;
`;

const ChartGrid = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
`;

const ChartCard = styled.div`
  flex: ${(props) => props.$flex || 1};
  background-color: var(--background);
  padding: 24px;
  border-radius: 10px;
  box-shadow: var(--shadow);
  min-width: 0;
`;

const ChartTitle = styled.h2`
  font-size: 16px;
  color: var(--font);
  font-weight: 800;
  margin-bottom: 20px;
  margin-top: 0;
`;

const TableCard = styled.div`
  background-color: var(--background, white);
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
  color: var(--font2, #64748b);
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
    props.$prob >= 80 ? "#fee2e2" : props.$prob >= 50 ? "#fef3c7" : "#d1fae5"};
  color: ${(props) =>
    props.$prob >= 80 ? "#dc2626" : props.$prob >= 50 ? "#d97706" : "#16a34a"};
`;
