import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import axiosApi from "../api/AxiosApi.js";


export default function PredictiveAnalysis() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleAnalyze = () => {
    if (!file) {
      alert("먼저 CSV 파일을 선택해주세요.");
      return;
    }

    setIsAnalyzing(true);
    
    // 데이터 받기
    axiosApi.post("/analyze", { filename: file.name })
      .then((response) => {
        setResult(response);
        setIsAnalyzing(false);
      })
      .catch((error) => {
        console.error("Analysis Error:", error);
        setIsAnalyzing(false);
      });

    setResult(null);

    // 가상의 정밀 분석 데이터 생성 (현업 수준의 디테일)
    // setTimeout(() => {
    //   const mockResult = {
    //     summary: {
    //       status: "주의: 축정렬 불량 징후 감지",
    //       probability: 85,
    //       alarm: "현 추세 유지 시 72시간 내 장비 정지 위험",
    //       guide:
    //         "커플링 체결 상태 확인 및 레이저 축정렬(Alignment) 즉시 수행 권장",
    //       filename: file.name,
    //     },
    //     // 1. 시간 영역 파형 데이터 (Time Waveform)
    //     waveformData: Array.from({ length: 50 }, (_, i) => ({
    //       time: `+${(i * 0.02).toFixed(2)}s`,
    //       vibration: (
    //         Math.sin(i) * 2.5 +
    //         Math.random() * 2 +
    //         (i > 30 ? 3 : 0)
    //       ).toFixed(2),
    //       current: (Math.cos(i) * 1.5 + 4 + Math.random() * 1).toFixed(2),
    //     })),
    //     // 2. 주파수 스펙트럼 데이터 (FFT) - 축정렬 불량은 1X, 2X RPM에서 피크가 발생함
    //     fftData: [
    //       { freq: "0.5X", amplitude: 1.2 },
    //       { freq: "1X (RPM)", amplitude: 8.5 }, // 피크 발생
    //       { freq: "1.5X", amplitude: 0.8 },
    //       { freq: "2X", amplitude: 6.2 }, // 두 번째 피크
    //       { freq: "2.5X", amplitude: 0.5 },
    //       { freq: "3X", amplitude: 2.1 },
    //       { freq: "4X", amplitude: 0.9 },
    //       { freq: "5X", amplitude: 0.4 },
    //     ],
    //     // 3. 설비 건전성(Health Score) 하락 추이
    //     healthTrend: Array.from({ length: 14 }, (_, i) => ({
    //       day: `D-${14 - i}`,
    //       score: Math.max(0, 95 - i * i * 0.3 - Math.random() * 5).toFixed(1),
    //     })),
    //     // 4. 결함 원인 기여도 (Radar)
    //     featureImportance: [
    //       { subject: "수평 진동 (X)", A: 85, fullMark: 100 },
    //       { subject: "수직 진동 (Y)", A: 65, fullMark: 100 },
    //       { subject: "축방향 진동 (Z)", A: 92, fullMark: 100 },
    //       { subject: "전류 불균형", A: 78, fullMark: 100 },
    //       { subject: "베어링 온도", A: 45, fullMark: 100 },
    //       { subject: "고주파 소음", A: 30, fullMark: 100 },
    //     ],
    //   };

    //   setResult(mockResult);
    //   setIsAnalyzing(false);
    // }, 3500);
  };

  return (
    <PageContainer>
      <Header>
        <Title>AI 파형 분석 및 정밀 진단</Title>
        <Subtitle>
          업로드된 센서 데이터(CSV)의 시계열 및 주파수 특성을 분석하여 기계적
          결함을 예측합니다.
        </Subtitle>
      </Header>

      <UploadSection>
        <UploadBox>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csv-upload"
            style={{ display: "none" }}
          />
          <label htmlFor="csv-upload">
            <UploadIcon>
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </UploadIcon>
            <UploadText>
              {file ? file.name : "클릭하여 분석할 CSV 파일을 선택해주세요"}
            </UploadText>
          </label>
        </UploadBox>

        <AnalyzeButton onClick={handleAnalyze} disabled={isAnalyzing || !file}>
          {isAnalyzing ? "FFT 변환 및 AI 모델 추론 중..." : "정밀 분석 시작"}
        </AnalyzeButton>
      </UploadSection>

      {isAnalyzing && (
        <LoadingSection>
          <Spinner />
          <LoadingText>
            데이터 전처리 및 다차원 패턴 분석을 진행하고 있습니다...
          </LoadingText>
          <LoadingSub>약 3~5초 정도 소요됩니다.</LoadingSub>
        </LoadingSection>
      )}

      {result && !isAnalyzing && (
        <ResultSection>
          <SectionTitle>AI 종합 진단 리포트</SectionTitle>

          {/* 상단: 요약 카드 */}
          <ResultGrid>
            <ResultCard $type="status">
              <CardHeader>현재 진단 상태</CardHeader>
              <CardBody>
                {result.summary.status}
                <Probability>
                  {" "}
                  (신뢰도 {result.summary.probability}%)
                </Probability>
              </CardBody>
            </ResultCard>

            <ResultCard $type="alarm">
              <CardHeader>예측 알람 및 잔여 수명(RUL)</CardHeader>
              <CardBody>{result.summary.alarm}</CardBody>
            </ResultCard>

            <ResultCard $type="guide">
              <CardHeader>권장 액션 가이드</CardHeader>
              <CardBody>{result.summary.guide}</CardBody>
            </ResultCard>
          </ResultGrid>

          {/* 중단: 시계열 파형 및 FFT 주파수 스펙트럼 */}
          <ChartGrid>
            <ChartCard>
              <ChartTitle>원시 데이터 파형 (Time-domain Waveform)</ChartTitle>
              <ChartSubtitle>
                분석 구간 내 진동 및 전류의 시간적 변화량
              </ChartSubtitle>
              <ChartWrapper>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={result.waveformData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", marginTop: "10px" }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="vibration"
                      name="진동 (mm/s)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="current"
                      name="전류 (A)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </ChartCard>

            <ChartCard>
              <ChartTitle>주파수 스펙트럼 (FFT Analysis)</ChartTitle>
              <ChartSubtitle>
                1X, 2X 회전 주파수 대역에서의 비정상 피크 감지
              </ChartSubtitle>
              <ChartWrapper>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={result.fftData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="freq"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                    />
                    <ReferenceLine
                      y={5}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        position: "top",
                        value: "경고 임계치",
                        fill: "#f59e0b",
                        fontSize: 10,
                      }}
                    />
                    <Bar
                      dataKey="amplitude"
                      name="진폭 (Amplitude)"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </ChartCard>
          </ChartGrid>

          {/* 하단: 건전성 추이 및 요인 기여도 */}
          <ChartGrid>
            <ChartCard>
              <ChartTitle>설비 건전성 지수 하락 추이 (Health Score)</ChartTitle>
              <ChartSubtitle>최근 2주간의 AI 종합 점수 변화 이력</ChartSubtitle>
              <ChartWrapper>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={result.healthTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorScore"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                    />
                    <ReferenceLine
                      y={30}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        position: "insideBottomLeft",
                        value: "위험 구간",
                        fill: "#ef4444",
                        fontSize: 10,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="건전성 점수"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </ChartCard>

            <ChartCard>
              <ChartTitle>결함 요인 기여도 (Feature Importance)</ChartTitle>
              <ChartSubtitle>
                현재 불량 징후에 가장 큰 영향을 미친 다변량 데이터 요소
              </ChartSubtitle>
              <ChartWrapper>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={result.featureImportance}
                  >
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Radar
                      name="이상 기여도"
                      dataKey="A"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </ChartCard>
          </ChartGrid>
        </ResultSection>
      )}
    </PageContainer>
  );
}

// --- CSS 스타일 ---
const PageContainer = styled.div`
  padding: 30px;
  background-color: #f8fafc;
  min-height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
  gap: 25px;
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
  font-size: 15px;
  color: #64748b;
  margin-top: 8px;
`;

const UploadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const UploadBox = styled.div`
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  transition: all 0.2s ease;
  background-color: #f8fafc;

  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  label {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
`;

const UploadIcon = styled.div`
  color: #3b82f6;
`;

const UploadText = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #334155;
`;

const AnalyzeButton = styled.button`
  padding: 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);

  &:disabled {
    background-color: #94a3b8;
    box-shadow: none;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #2563eb;
    transform: translateY(-1px);
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
`;

const LoadingSub = styled.div`
  font-size: 14px;
  color: #64748b;
`;

const ResultSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 10px 0 0 0;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 20px;
    background-color: #3b82f6;
    border-radius: 4px;
  }
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
`;

const ResultCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border-top: 5px solid
    ${(props) => {
      if (props.$type === "status") return "#ef4444";
      if (props.$type === "alarm") return "#f59e0b";
      if (props.$type === "guide") return "#3b82f6";
      return "#cbd5e1";
    }};
`;

const CardHeader = styled.div`
  font-size: 15px;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 12px;
`;

const CardBody = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.5;
`;

const Probability = styled.span`
  color: #ef4444;
  font-size: 16px;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
`;

const ChartCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
`;

const ChartTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px 0;
`;

const ChartSubtitle = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0 0 20px 0;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 260px;
`;
