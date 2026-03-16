import React, { useState } from "react";
import {
  AreaChart,
  Area,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 현업 스타일의 세련된 UI 디자인
const styles = {
  container: {
    width: "100%",
    padding: "30px",
    boxSizing: "border-box",
    backgroundColor: "#f1f5f9",
    minHeight: "100vh",
    fontFamily: '"Malgun Gothic", sans-serif',
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "24px",
  },
  pageTitle: {
    fontSize: "26px",
    color: "#0f172a",
    margin: "0 0 8px 0",
    fontWeight: "800",
  },
  pageSubtitle: { fontSize: "14px", color: "#64748b", margin: 0 },
  buttonGroup: { display: "flex", gap: "10px" },
  btnOutline: {
    padding: "8px 16px",
    backgroundColor: "white",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  btnPrimary: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },

  // 검색/필터 영역
  filterCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    marginBottom: "24px",
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },
  filterGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  filterLabel: { fontSize: "13px", color: "#64748b", fontWeight: "600" },
  filterSelect: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#334155",
    width: "200px",
    outline: "none",
  },

  // KPI 요약 영역
  kpiGrid: { display: "flex", gap: "20px", marginBottom: "24px" },
  kpiCard: {
    flex: 1,
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    borderLeft: "4px solid #3b82f6",
  },
  kpiLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
    fontWeight: "600",
  },
  kpiValue: { fontSize: "28px", color: "#0f172a", fontWeight: "800" },
  kpiSubText: { fontSize: "12px", color: "#94a3b8", marginTop: "8px" },

  // 차트 영역
  chartGrid: { display: "flex", gap: "20px", marginBottom: "24px" },
  chartCard: {
    flex: 1,
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    minWidth: "0",
  },
  chartTitle: {
    fontSize: "16px",
    color: "#0f172a",
    fontWeight: "800",
    marginBottom: "20px",
  },

  // 상세 데이터 표 영역
  tableCard: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: {
    padding: "14px 16px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "16px",
    color: "#334155",
    fontSize: "14px",
    borderBottom: "1px solid #f1f5f9",
  },
  statusBadge: (prob) => ({
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "800",
    backgroundColor:
      prob >= 80 ? "#fee2e2" : prob >= 50 ? "#fef3c7" : "#d1fae5",
    color: prob >= 80 ? "#dc2626" : prob >= 50 ? "#d97706" : "#16a34a",
  }),
};

// 현업 수준의 풍부한 가상 데이터
const timeSeriesData = [
  { time: "09:00", vibration: 0.02, temp: 35, current: 2.1, prob: 5 },
  { time: "10:00", vibration: 0.03, temp: 36, current: 2.2, prob: 8 },
  { time: "11:00", vibration: 0.05, temp: 39, current: 2.5, prob: 15 },
  { time: "12:00", vibration: 0.08, temp: 42, current: 2.8, prob: 45 },
  { time: "13:00", vibration: 0.12, temp: 48, current: 3.0, prob: 65 },
  { time: "14:00", vibration: 0.18, temp: 55, current: 3.4, prob: 88 },
  { time: "15:00", vibration: 0.19, temp: 58, current: 3.5, prob: 95 },
  { time: "16:00", vibration: 0.04, temp: 38, current: 2.3, prob: 10 }, // 점검 후 안정화 가정
];

// 설비별 평균 위험도 데이터 (Bar 차트용)
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

  // 최고 온도 및 최고 위험도 계산
  const maxTemp = Math.max(...history.map((d) => d.temp));
  const maxProb = Math.max(...history.map((d) => d.prob));
  const dangerCount = history.filter((d) => d.prob >= 80).length;

  return (
    <div style={styles.container}>
      {/* 1. 상단 타이틀 및 버튼 영역 */}
      <div style={styles.headerContainer}>
        <div>
          <h1 style={styles.pageTitle}>설비 종합 분석 리포트</h1>
          <p style={styles.pageSubtitle}>
            과거 센서 데이터 추이 및 AI 고장 예측 이력 분석
          </p>
        </div>
        <div style={styles.buttonGroup}>
          <button style={styles.btnOutline}>엑셀 다운로드 (CSV)</button>
          <button style={styles.btnPrimary}>PDF 보고서 출력</button>
        </div>
      </div>

      {/* 2. 검색 및 필터 영역 (현업 필수 기능) */}
      <div style={styles.filterCard}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>조회 기간</label>
          <select style={styles.filterSelect}>
            <option>최근 24시간</option>
            <option>최근 7일</option>
            <option>최근 30일</option>
            <option>사용자 지정 날짜...</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>대상 설비 그룹</label>
          <select style={styles.filterSelect}>
            <option>전체 설비</option>
            <option>A동 라인 (컨베이어)</option>
            <option>B동 라인 (프레스)</option>
            <option>고위험군 (Label 1) 설비만</option>
          </select>
        </div>
        <button
          style={{
            ...styles.btnPrimary,
            alignSelf: "flex-end",
            padding: "10px 24px",
          }}
        >
          조회하기
        </button>
      </div>

      {/* 3. 기간 내 KPI 요약 */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>조회 기간 내 최고 온도</div>
          <div style={styles.kpiValue}>{maxTemp} °C</div>
          <div style={styles.kpiSubText}>임계치(50°C) 초과 이력 있음</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>AI 최고 예측 고장 확률</div>
          <div style={{ ...styles.kpiValue, color: "#dc2626" }}>
            {maxProb} %
          </div>
          <div style={styles.kpiSubText}>15:00 기준 최고치 기록</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>위험 감지 횟수 (80% 이상)</div>
          <div style={{ ...styles.kpiValue, color: "#dc2626" }}>
            {dangerCount} 회
          </div>
          <div style={styles.kpiSubText}>즉시 점검 권고 수준</div>
        </div>
      </div>

      {/* 4. 종합 분석 차트 영역 */}
      <div style={styles.chartGrid}>
        {/* 복합 차트: 진동과 온도 변화의 상관관계 추이 */}
        <div style={{ ...styles.chartCard, flex: 2 }}>
          <div style={styles.chartTitle}>
            센서 복합 상관 추이 (진동 vs 온도)
          </div>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              {/* ComposedChart를 사용하면 선과 영역을 함께 그릴 수 있습니다. */}
              <ComposedChart
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
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
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
                {/* 온도는 면적(Area)으로 부드럽게 표현 */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="temp"
                  name="온도(°C)"
                  fill="#fee2e2"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
                {/* 진동은 뚜렷한 선(Line)으로 표현 */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="vibration"
                  name="진동 수치"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 바 차트: 설비별 위험도 비교 */}
        <div style={{ ...styles.chartCard, flex: 1 }}>
          <div style={styles.chartTitle}>설비별 평균 위험도 누적 현황</div>
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
                {/* 막대그래프를 사용하여 설비 간 위험도를 직관적으로 비교 */}
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
        </div>
      </div>

      {/* 5. 상세 이력 테이블 */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div style={styles.chartTitle}>
            센서 로우 데이터 및 예측 이력 상세
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            총 {history.length}건의 기록
          </div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>측정 시간</th>
              <th style={styles.th}>진동 (Threshold: 0.1)</th>
              <th style={styles.th}>온도 (Threshold: 50°C)</th>
              <th style={styles.th}>전류 (A)</th>
              <th style={styles.th}>AI 고장 예측 확률</th>
              <th style={styles.th}>최종 상태 판정</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr key={i}>
                <td
                  style={{ ...styles.td, fontWeight: "600", color: "#0f172a" }}
                >
                  {row.time}
                </td>
                <td
                  style={{
                    ...styles.td,
                    color: row.vibration >= 0.1 ? "#ef4444" : "#334155",
                    fontWeight: row.vibration >= 0.1 ? "800" : "normal",
                  }}
                >
                  {row.vibration}
                </td>
                <td
                  style={{
                    ...styles.td,
                    color: row.temp >= 50 ? "#ef4444" : "#334155",
                    fontWeight: row.temp >= 50 ? "800" : "normal",
                  }}
                >
                  {row.temp} °C
                </td>
                <td style={styles.td}>{row.current}</td>
                <td style={styles.td}>
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
                </td>
                <td style={styles.td}>
                  {/* 확률에 따라 위험, 주의, 정상 3단계로 명확히 표시 */}
                  <span style={styles.statusBadge(row.prob)}>
                    {row.prob >= 80
                      ? "위험 (조치 요망)"
                      : row.prob >= 50
                        ? "주의 (관찰 필요)"
                        : "정상 가동"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
