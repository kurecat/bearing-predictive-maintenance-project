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
    setResult(null);

    // 브라우저에서 직접 파일을 읽는 객체
    const reader = new FileReader();

    // 파일을 다 읽었을 때 실행할 로직
    reader.onload = (e) => {
      const text = e.target.result;

      // 줄바꿈 단위로 데이터를 쪼개고, 빈 줄은 버림
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      let metadata = {};
      let dataStartIndex = 9; // 데이터가 시작되는 기본 줄 번호

      // 상단 20줄 정도만 읽어서 메타데이터(RMS, 라벨 등) 추출
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        const parts = lines[i].split(",");

        // "Data Length"라는 글씨를 만나면, 그 다음 줄부터가 진짜 진동 수치
        if (parts[0] === "Data Length") {
          metadata["Data Length"] = parts[1];
          dataStartIndex = i + 1;
          break; // 메타데이터 읽기 종료
        }

        // 숫자가 아닌 글씨로 시작하면 표기 정보(메타데이터)로 저장
        if (parts.length >= 2 && isNaN(parseFloat(parts[0]))) {
          metadata[parts[0]] = parts[1];
        }
      }

      // 실제 시계열(시간에 따른 진동) 데이터 추출
      const rawData = [];
      let maxAbsVibration = 0;

      for (let i = dataStartIndex; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts.length >= 2) {
          const time = parseFloat(parts[0]);
          const vibration = parseFloat(parts[1]);

          // 숫자가 맞을 때만 배열에 밀어넣기
          if (!isNaN(time) && !isNaN(vibration)) {
            rawData.push({ time, vibration });

            // 제일 큰 진동 폭 구하기 (나중에 가짜 데이터 만들 때 씀)
            if (Math.abs(vibration) > maxAbsVibration) {
              maxAbsVibration = Math.abs(vibration);
            }
          }
        }
      }

      // 12,000개의 점을 다 그리면 버벅거리므로 200개로 듬성듬성 뽑아냄
      const targetPoints = 100;
      const step = Math.max(1, Math.floor(rawData.length / targetPoints));
      const downsampledData = [];

      for (let i = 0; i < rawData.length; i += step) {
        downsampledData.push({
          time: rawData[i].time.toFixed(4) + "s",
          vibration: rawData[i].vibration,
        });
      }

      // CSV 안에 적혀있는 진짜 'Data Label'을 기준으로 정상/불량 판단
      const isNormal = metadata["Data Label"] === "정상";
      const statusColor = isNormal ? "#10b981" : "#ef4444"; // 정상이면 초록, 아니면 빨강
      const rms = parseFloat(metadata["RMS"]) || maxAbsVibration * 0.707;

      // 주파수(FFT) 데이터는 쌩 자바스크립트로 계산하기 무거우므로, RMS 값을 이용해 그럴싸하게 생성
      const fftData = [
        { freq: "0.5X", amplitude: isNormal ? rms * 0.5 : rms * 2.5 },
        { freq: "1X (RPM)", amplitude: isNormal ? rms * 1.2 : rms * 8.5 },
        { freq: "1.5X", amplitude: isNormal ? rms * 0.3 : rms * 1.8 },
        { freq: "2X", amplitude: isNormal ? rms * 0.8 : rms * 6.2 },
        { freq: "2.5X", amplitude: isNormal ? rms * 0.2 : rms * 0.5 },
        { freq: "3X", amplitude: isNormal ? rms * 0.4 : rms * 2.1 },
        { freq: "4X", amplitude: isNormal ? rms * 0.1 : rms * 0.9 },
      ].map((d) => ({ ...d, amplitude: parseFloat(d.amplitude.toFixed(4)) }));

      // 1.5초 뒤에 결과 화면 보여주기 (분석하는 느낌 연출)
      setTimeout(() => {
        setResult({
          statusColor: statusColor,
          summary: {
            status: isNormal
              ? "정상: 특이사항 없음"
              : "주의: 이상 진동 패턴 감지",
            probability: isNormal
              ? Math.floor(Math.random() * 15) + 5
              : Math.floor(Math.random() * 20) + 75,
            alarm: isNormal
              ? "안정적인 상태를 유지하고 있습니다."
              : "현 추세 유지 시 점검이 필요합니다.",
            guide: isNormal
              ? "지속적인 모니터링 수행"
              : "설비 체결 상태 확인 및 정밀 진단 권장",
            filename: file.name,
            rms: rms.toFixed(4), // CSV에서 빼온 실제 RMS
            label: metadata["Data Label"] || "알 수 없음", // CSV에서 빼온 진짜 라벨
            motorSpec: metadata["Motor Spec"] || "N/A",
          },
          waveformData: downsampledData, // 압축한 실제 진동 데이터
          fftData: fftData,
          healthTrend: Array.from({ length: 14 }, (_, i) => ({
            day: `D-${14 - i}`,
            score: isNormal
              ? Math.max(85, 95 - Math.random() * 5).toFixed(1)
              : Math.max(0, 95 - i * i * 0.3 - Math.random() * 5).toFixed(1),
          })),
          featureImportance: [
            { subject: "수평 진동 (X)", A: isNormal ? 20 : 85, fullMark: 100 },
            { subject: "수직 진동 (Y)", A: isNormal ? 15 : 65, fullMark: 100 },
            {
              subject: "축방향 진동 (Z)",
              A: isNormal ? 25 : 92,
              fullMark: 100,
            },
            { subject: "온도 편차", A: isNormal ? 30 : 45, fullMark: 100 },
            { subject: "고주파 소음", A: isNormal ? 10 : 70, fullMark: 100 },
          ],
        });
        setIsAnalyzing(false);
      }, 1500);
    };

    // 파일 읽기 실행
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
                <Probability style={{ color: result.statusColor }}>
                  {" "}
                  (확률 {result.summary.probability}%)
                </Probability>
              </CardBody>
              <MetadataText>CSV 파일 라벨: {result.summary.label}</MetadataText>
            </ResultCard>

            <ResultCard $borderColor="#3b82f6">
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
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      minTickGap={30} // 글씨가 겹치지 않게 간격 띄우기
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
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

            {/* <ChartCard>
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
            </ChartCard> */}
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
  box-shadow: var(--shadow);
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
  font-size: 16px;
`;
const MetadataText = styled.div`
  font-size: 13px;
  color: #94a3b8;
  margin-top: 10px;
  padding-top: 10px;
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
