import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import axiosApi from "../api/AxiosApi";
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



export default function PredictiveAnalysis() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null); // 새 파일이 올라오면 기존 결과 지우기
    }
  };

  const handleAnalyze = () => {
    if (!file) {
      alert("먼저 CSV 파일을 선택해주세요.");
      return;
    }

    setIsAnalyzing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      let meta = {};
      let rmsValues = [];
      let samples = [];

      for (let line of lines) {
        const parts = line
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p);
        if (!parts.length) continue;

        // 첫 번째 키를 소문자로 바꾸고 언더바를 공백으로 치환
        const key = parts[0].toLowerCase().replace("_", " ");

        switch (key) {
          case "date":
            meta.Date = parts[1];
            break;
          case "filename":
            meta.Filename = parts[1];
            break;
          case "data label":
            meta.DataLabel = parts[1] || null;
            break;
          case "label no":
            meta.LabelNo = parts[1] || null;
            break;
          case "motor spec":
            meta.MotorSpec = parts.slice(1).join(",");
            break;
          case "period":
            meta.Period = parts[1];
            break;
          case "sample rate":
            meta.SampleRate = parseInt(parts[1]);
            break;
          case "rms":
            rmsValues = parts.slice(1).map((v) => parseFloat(v));
            break;
          case "data length":
            meta.DataLength = parseInt(parts[1]);
            break;
          default:
            const nums = parts.map((p) => parseFloat(p));
            if (nums.every((n) => !isNaN(n))) {
              samples.push(nums);
            }
        }
      }

      const result = {
        Date: meta.Date,
        Filename: meta.Filename,
        DataLabel: meta.DataLabel,
        LabelNo: meta.LabelNo,
        MotorSpec: meta.MotorSpec,
        Period: meta.Period,
        SampleRate: meta.SampleRate,
        RMS: rmsValues,
        DataLength: meta.DataLength,
        Samples: samples,
      };

      // 서버로 JSON 전송
      axiosApi.post("/api/analyze/vibration", result, {
        headers: { "Content-Type": "application/json" }
      })
        .then((response) => {
          const resData = response.data || response;

          const prob = resData.summary.probability;
          resData.statusColor = prob >= 50 ? "var(--error)" : "var(--main)";

          setResult(resData);
          setIsAnalyzing(false);
        })
        .catch((error) => {
          console.error("Analysis Error:", error);
          setIsAnalyzing(false);
        });
    };

    reader.readAsText(file, "UTF-8");
  };

  return (
    <PageContainer>
      <Header>
        <Title>AI 파형 분석 및 정밀 진단</Title>
        <Subtitle>
          업로드된 센서 데이터(CSV)의 시계열 특성을 분석하여 기계적 결함을
          예측합니다.
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
          {isAnalyzing ? "실제 데이터 파싱 및 추론 중..." : "정밀 분석 시작"}
        </AnalyzeButton>
      </UploadSection>

      {isAnalyzing && (
        <LoadingSection>
          <Spinner />
          <LoadingText>분석 중...</LoadingText>
          <LoadingSub>잠시만 기다려주세요.</LoadingSub>
        </LoadingSection>
      )}

      {result && !isAnalyzing && (
        <ResultSection>
          <SectionTitle>AI 종합 진단 리포트</SectionTitle>

          {/* 상단: 요약 카드 (CSV 파일의 메타데이터 출력 추가) */}
          <ResultGrid>
            <ResultCard $borderColor={result.statusColor}>
              <CardHeader>현재 진단 상태</CardHeader>
              <CardBody>
                {result.summary.status}
                <div></div>
                <Probability style={{ color: result.statusColor }}>
                  {" "}
                  (확률 {result.summary.probability}%)
                </Probability>
              </CardBody>
              {/* <MetadataText>CSV 파일 라벨: {result.summary.label}</MetadataText> */}
            </ResultCard>

            <ResultCard $borderColor="var(--main)">
              <CardHeader>데이터 측정 지표 (RMS)</CardHeader>
              <CardBody>{result.summary.rms} mm/s</CardBody>
              <MetadataText>장비 스펙: {result.summary.motorSpec}</MetadataText>
            </ResultCard>

            <ResultCard $borderColor="#8b5cf6">
              <CardHeader>권장 액션 가이드</CardHeader>
              <CardBody>{result.summary.guide}</CardBody>
              <MetadataText>{result.summary.alarm}</MetadataText>
            </ResultCard>
          </ResultGrid>

          {/* 중단: 시계열 파형 및 FFT 주파수 스펙트럼 */}
          <ChartGrid>
            <ChartCard>
              <ChartTitle>실제 진동 파형 (Time-domain Waveform)</ChartTitle>
              <ChartSubtitle>
                업로드하신 CSV 파일의 시간별 진동 수치
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
                      tick={{ fontSize: 11, fill: "var(--font2)" }}
                      minTickGap={30} // 글씨가 겹치지 않게 간격 띄우기
                    />
                    <YAxis tick={{ fontSize: 11, fill: "var(--font2)" }} />
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
                    {/* 선 색상도 정상/비정상에 따라 바뀜 */}
                    <Line
                      type="monotone"
                      dataKey="vibration"
                      name="진동 수치 (mm/s)"
                      stroke={result.statusColor}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </ChartCard>

            <ChartCard>
              <ChartTitle>주파수 스펙트럼 (FFT Analysis 추정)</ChartTitle>
              <ChartSubtitle>
                RMS 값에 기반하여 재구성된 주파수 피크 데이터
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
                      tick={{ fontSize: 11, fill: "var(--font2)" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "var(--font2)" }} />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="amplitude"
                      name="진폭 (Amplitude)"
                      fill={result.statusColor}
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </ChartCard>
          </ChartGrid>

          {/* 하단: 건전성 추이 및 요인 기여도 */}
          {/* <ChartGrid>
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
                          stopColor={result.statusColor}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={result.statusColor}
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
                      stroke={result.statusColor}
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
                현재 진단 결과에 가장 큰 영향을 미친 요소
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
                      stroke={result.statusColor}
                      fill={result.statusColor}
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </ChartCard>
          </ChartGrid> */}
        </ResultSection>
      )}
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

const UploadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: var(--shadow);
  animation: fadeIn 0.5s ease-in-out;
`;

const UploadBox = styled.div`
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  transition: all 0.2s ease;
  background-color: #f8fafc;

  &:hover {
    border-color: var(--main);
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
  color: var(--main);
`;

const UploadText = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #334155;
`;

const AnalyzeButton = styled.button`
  padding: 16px;
  background-color: var(--main);
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
  border-top: 4px solid var(--main);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: var(--font);
`;

const LoadingSub = styled.div`
  font-size: 14px;
  color: var(--font2);
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
  color: var(--font);
  margin: 10px 0 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
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
  box-shadow: var(--shadow);
`;

const CardHeader = styled.div`
  font-size: 15px;
  color: var(--font2);
  font-weight: 700;
  margin-bottom: 12px;
`;

const CardBody = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: var(--font);
  line-height: 1.5;
`;

const Probability = styled.span`
  font-size: 16px;
`;
const MetadataText = styled.div`
  font-size: 13px;
  color: var(--font2);
  margin-top: 5px;
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
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
`;

const ChartTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  color: var(--font);
  margin: 0 0 6px 0;
`;

const ChartSubtitle = styled.p`
  font-size: 13px;
  color: var(--font2);
  margin: 0 0 20px 0;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 260px;
`;
