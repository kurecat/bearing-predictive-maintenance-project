import React, { useState } from "react";
import styled from "styled-components";

// 가상 데이터 (온도 제외)
const initialMotors = [
  { id: "M-101", vibration: 0.02, current: 2.1, prob: 2, label: 0 },
  { id: "M-102", vibration: 0.03, current: 2.2, prob: 5, label: 0 },
  { id: "M-103", vibration: 0.18, current: 3.4, prob: 92, label: 1 },
];

export default function Dashboard() {
  const [motorData, setMotorData] = useState(initialMotors);
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
        // 진동, 전류 2가지 데이터만 처리
        if (cols.length >= 2) {
          const v = parseFloat(cols[0]);
          const c = parseFloat(cols[1]);

          let probability = 5;
          let newLabel = 0;

          // 온도 조건 삭제, 진동만 체크
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
        <Title>현장 모터 예지보전 통합 관제실</Title>
        <Subtitle>실시간 모니터링 시스템 작동 중...</Subtitle>
      </Header>

      <MainGrid>
        <LeftPanel>
          <Card>
            <CardTitle>센서 데이터 업로드 (CSV)</CardTitle>
            <DropZone
              $isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <DropText>클릭하거나 CSV 파일을 이곳에 드롭하세요</DropText>
              <DropSubText>형식: vibration, current</DropSubText>
            </DropZone>
          </Card>

          <Card>
            <CardTitle>실시간 위험 감지 로그</CardTitle>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {alertLogs.map((log, index) => (
                <LogBox key={index}>
                  <LogTime>{log.time}</LogTime>
                  <LogText>{log.message}</LogText>
                </LogBox>
              ))}
              {alertLogs.length === 0 && (
                <div
                  style={{ fontSize: "var(--fontXs)", color: "var(--font2)" }}
                >
                  감지된 위험 내역이 없습니다.
                </div>
              )}
            </div>
          </Card>
        </LeftPanel>

        <RightPanel>
          <KpiRow>
            <KpiBox>
              <KpiLabel>전체 관제 모터</KpiLabel>
              <KpiValue>{total} 대</KpiValue>
            </KpiBox>
            <KpiBox>
              <KpiLabel>정상 가동 (Label 0)</KpiLabel>
              <KpiValue $color="var(--run)">{total - faults} 대</KpiValue>
            </KpiBox>
            <KpiBox $bg="var(--bgError)" $borderColor="#ffcccc">
              <KpiLabel $color="var(--error)">고장 위험 (Label 1)</KpiLabel>
              <KpiValue $color="var(--error)">{faults} 대</KpiValue>
            </KpiBox>
          </KpiRow>

          <Card>
            <CardTitle>모터별 정밀 분석 현황</CardTitle>
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
                      <Td style={{ fontWeight: "var(--bold)" }}>{motor.id}</Td>
                      <Td
                        style={{
                          color:
                            motor.vibration >= 0.1
                              ? "var(--error)"
                              : "var(--font)",
                          fontWeight:
                            motor.vibration >= 0.1
                              ? "var(--bold)"
                              : "var(--normal)",
                        }}
                      >
                        {motor.vibration}
                      </Td>
                      <Td>{motor.current} A</Td>

                      <Td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <BarBg>
                            <BarFill $val={motor.prob} $color={probColor} />
                          </BarBg>
                          <span
                            style={{
                              color: probColor,
                              fontWeight: "var(--bold)",
                              fontSize: "var(--fontXs)",
                            }}
                          >
                            {motor.prob}%
                          </span>
                        </div>
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
          </Card>
        </RightPanel>
      </MainGrid>
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
  align-items: center;
  margin-bottom: 30px;
  width: 100%;
`;

const Title = styled.h1`
  font-size: var(--fontTitle);
  color: var(--font);
  font-weight: 800;
`;

const Subtitle = styled.div`
  font-size: var(--fontSm);
  color: var(--font2);
`;

const MainGrid = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
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

const Card = styled.div`
  background-color: var(--background);
  padding: 20px;
  border-radius: 12px;
  box-shadow: var(--shadow);
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
    props.$isDragging ? "var(--background2)" : "var(--background)"};
  border-radius: 8px;
  padding: 40px 20px;
  color: var(--font2);
  cursor: pointer;
  transition: all 0.3s ease;
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

const LogBox = styled.div`
  background-color: var(--bgError);
  border-left: 4px solid var(--error);
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
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
`;

const Td = styled.td`
  padding: 12px;
  color: var(--font);
  font-size: var(--fontSm);
  border-bottom: 1px solid var(--border);
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
