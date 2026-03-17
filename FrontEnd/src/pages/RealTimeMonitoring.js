import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

// 가상 데이터 생성기
const initialNodes = Array.from({ length: 9 }, (_, i) => ({
  id: `MTR-${101 + i}`,
  name: `라인-${String.fromCharCode(65 + Math.floor(i / 3))} 모터 ${(i % 3) + 1}`,
  vibration: 0.02,
  current: 2.1,
  prob: 5,
  history: Array.from({ length: 20 }, () => ({ val: 0.02 })), // 차트용 데이터
}));

export default function RealTimeMonitoring() {
  const [nodes, setNodes] = useState(initialNodes);

  // 모달 제어 및 입력 폼 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    device_id: "",
    ip_address: "",
    port: "",
  });

  // 위험 감지 모달(알림) 상태 관리
  const [alerts, setAlerts] = useState([]);

  // 알림을 발생시키는 함수 (이름과 확률을 따로 받아 줄바꿈 처리)
  const triggerAlert = (name, prob) => {
    const newAlert = { id: Date.now(), name, prob };
    setAlerts((prev) => [...prev, newAlert]);
  };

  // 사용자가 알림 모달의 '확인' 또는 'X' 버튼을 눌렀을 때 처리
  const handleCloseAlerts = () => {
    setAlerts([]); // 모든 알림 지우기
  };

  // 실시간 시뮬레이션 및 웹소켓 뼈대 로직
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          // 약간의 랜덤 변동성 부여
          const randV = Math.max(
            0.01,
            node.vibration + (Math.random() - 0.5) * 0.01,
          );

          // 특정 노드(MTR-105)에 고의로 고장 징후 시뮬레이션
          const isTarget = node.id === "MTR-105";
          const finalV = isTarget ? randV + 0.05 : randV;

          // 고장 확률 로직
          const finalProb = Math.min(100, Math.floor((finalV / 0.2) * 100));

          // 이전 확률은 80% 미만이었는데, 방금 80% 이상으로 뛰었다면 모달 알림 발생
          if (finalProb >= 80 && node.prob < 80) {
            triggerAlert(node.name, finalProb);
          }

          return {
            ...node,
            vibration: parseFloat(finalV.toFixed(3)),
            prob: finalProb,
            history: [...node.history.slice(1), { val: finalV }],
          };
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 장비 등록 모달 닫기 및 폼 초기화
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDeviceForm({ device_id: "", ip_address: "", port: "" });
  };

  // 폼 입력값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeviceForm((prev) => ({ ...prev, [name]: value }));
  };

  // 장비 등록 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!deviceForm.device_id || !deviceForm.ip_address || !deviceForm.port) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    const newNode = {
      id: deviceForm.device_id,
      name: `신규 등록 장비 (${deviceForm.ip_address})`,
      vibration: 0.01,
      current: 2.0,
      prob: 1,
      history: Array.from({ length: 20 }, () => ({ val: 0.01 })),
    };

    setNodes((prev) => [...prev, newNode]);
    alert(
      "장비가 화면에 임시 등록되었습니다.\n추후 POST /api/devices API 연동이 필요합니다.",
    );
    handleCloseModal();
  };

  return (
    <PageContainer>
      <Header>
        <TitleGroup>
          <Title>실시간 모터 통합 관제</Title>
        </TitleGroup>

        <RightControls>
          <StatusSummary>
            시스템 가동률: <Highlight>98.2%</Highlight> | 전체 모터:{" "}
            <Highlight>{nodes.length}대</Highlight>
          </StatusSummary>
          {/* 신규 장비 등록 보류 */}
          {/* <RegisterButton onClick={() => setIsModalOpen(true)}>
            + 신규 장비 등록
          </RegisterButton> */}
        </RightControls>
      </Header>

      <GridContainer>
        {nodes.map((node) => (
          <NodeCard key={node.id} $isDanger={node.prob >= 70}>
            <NodeHeader>
              <NodeInfo>
                <NodeID>{node.id}</NodeID>
                <NodeName>{node.name}</NodeName>
              </NodeInfo>
              <Badge
                $type={
                  node.prob >= 70
                    ? "danger"
                    : node.prob >= 40
                      ? "warning"
                      : "success"
                }
              >
                {node.prob >= 70
                  ? "위험"
                  : node.prob >= 40
                    ? "경고"
                    : "정상 가동"}
              </Badge>
            </NodeHeader>

            <ContentRow>
              <MainValue>
                <Label>진동 수치</Label>
                <Value $isDanger={node.vibration >= 0.1}>
                  {node.vibration} <Unit>mm/s</Unit>
                </Value>
              </MainValue>
            </ContentRow>

            <LargeChartContainer>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={node.history}>
                  <Line
                    type="monotone"
                    dataKey="val"
                    stroke={node.prob >= 70 ? "var(--error)" : "var(--main)"}
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <YAxis hide domain={["auto", "auto"]} />
                </LineChart>
              </ResponsiveContainer>
            </LargeChartContainer>

            <SubDataGrid>
              <SubItem>
                <Label>전류량</Label>
                <SubValue>{node.current} A</SubValue>
              </SubItem>
              <SubItem>
                <Label>고장확률</Label>
                <SubValue
                  style={{ color: "var(--main)", fontWeight: "var(--bold)" }}
                >
                  {node.prob}%
                </SubValue>
              </SubItem>
              <SubItem>
                <Label>현재 상태</Label>
                <SubValue
                  style={{
                    color: node.prob >= 70 ? "var(--error)" : "var(--font2)",
                  }}
                >
                  {node.prob >= 70 ? "점검 요망" : "이상 없음"}
                </SubValue>
              </SubItem>
            </SubDataGrid>

            <ProgressBarBg>
              <ProgressBarFill
                $width={node.prob}
                $color={node.prob >= 70 ? "var(--error)" : "var(--main)"}
              />
            </ProgressBarBg>
          </NodeCard>
        ))}
      </GridContainer>

      {/* 장비 등록 모달 창 */}
      {isModalOpen && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>신규 장비 등록</ModalTitle>
              <CloseIcon onClick={handleCloseModal}>✕</CloseIcon>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <FormLabel>장비 식별자 (Device ID)</FormLabel>
                <FormInput
                  type="text"
                  name="device_id"
                  placeholder="예: MTR-201"
                  value={deviceForm.device_id}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>IP 주소 (IP Address)</FormLabel>
                <FormInput
                  type="text"
                  name="ip_address"
                  placeholder="예: 192.168.0.15"
                  value={deviceForm.ip_address}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>포트 번호 (Port)</FormLabel>
                <FormInput
                  type="number"
                  name="port"
                  placeholder="예: 8080"
                  value={deviceForm.port}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <ModalFooter>
                <CancelButton type="button" onClick={handleCloseModal}>
                  취소
                </CancelButton>
                <SubmitButton type="submit">등록 완료</SubmitButton>
              </ModalFooter>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 위험 감지 알림 모달 창 */}
      {alerts.length > 0 && (
        <AlertModalOverlay>
          <AlertModalContent>
            <AlertHeader>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <WarningIcon>⚠️</WarningIcon>
                <AlertTitle>시스템 위험 감지</AlertTitle>
              </div>
              <CloseIcon onClick={handleCloseAlerts}>✕</CloseIcon>
            </AlertHeader>
            <AlertList>
              {alerts.map((alert) => (
                <AlertItem key={alert.id}>
                  <div style={{ textAlign: "center", lineHeight: "1.6" }}>
                    <div>[위험]</div>
                    <div>
                      {alert.name}의 고장 확률 {alert.prob}%
                    </div>
                  </div>
                </AlertItem>
              ))}
            </AlertList>
            <AlertButton onClick={handleCloseAlerts}>
              내용 확인 완료
            </AlertButton>
          </AlertModalContent>
        </AlertModalOverlay>
      )}
    </PageContainer>
  );
}

const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
`;

const PageContainer = styled.div`
  width: 100%;
  padding: 30px;
  box-sizing: border-box;
  background-color: var(--background2);
  min-height: calc(100vh - 50px);
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  width: 100%;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h2`
  font-size: var(--fontTitle);
  color: var(--font);
  font-weight: 800;
  margin: 0;
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const StatusSummary = styled.div`
  font-size: 14px;
  color: #64748b;
`;

const Highlight = styled.span`
  color: #0f172a;
  font-weight: 700;
`;

const RegisterButton = styled.button`
  background-color: var(--main);
  color: var(--font3);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: var(--fontSm);
  font-weight: var(--bold);
  transition: all 0.2s ease;

  &:hover {
    background-color: #1e2a82;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
`;

const NodeCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid
    ${(props) => (props.$isDanger ? "#fecaca" : "var(--border)")};
  box-shadow: var(--shadow);
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-4px);
  }
`;

const NodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const NodeInfo = styled.div``;

const NodeID = styled.div`
  font-size: var(--fontXs);
  color: var(--font2);
  font-weight: var(--bold);
`;

const NodeName = styled.div`
  font-size: var(--fontMd);
  font-weight: var(--bold);
  color: var(--font);
`;

const Badge = styled.div`
  font-size: var(--fontXxs);
  font-weight: var(--bold);
  padding: 4px 8px;
  border-radius: 20px;
  background-color: ${(props) =>
    props.$type === "danger"
      ? "var(--bgError)"
      : props.$type === "warning"
        ? "var(--bgWarning)"
        : "var(--bgRun)"};
  color: ${(props) =>
    props.$type === "danger"
      ? "var(--error)"
      : props.$type === "warning"
        ? "var(--waiting)"
        : "var(--run)"};
`;
const ContentRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

const MainValue = styled.div``;

const Label = styled.div`
  font-size: var(--fontXs);
  color: var(--font2);
  font-weight: var(--bold);
  margin-bottom: 4px;
`;

const Value = styled.div`
  font-size: 24px;
  font-weight: var(--bold);
  color: ${(props) => (props.$isDanger ? "var(--error)" : "var(--font)")};
`;

const Unit = styled.span`
  font-size: var(--fontXs);
  color: var(--font2);
`;

const LargeChartContainer = styled.div`
  width: 100%;
  margin-bottom: 16px;
  background-color: var(--background2);
  border-radius: 8px;
  padding: 8px 0;
`;

const SubDataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding-top: 12px;
  border-top: 1px solid var(--border);
  margin-bottom: 12px;
`;

const SubItem = styled.div``;

const SubValue = styled.div`
  font-size: var(--fontSm);
  font-weight: var(--bold);
  color: var(--font);
`;

const ProgressBarBg = styled.div`
  height: 6px;
  background: var(--border);
  border-radius: 10px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${(props) => props.$width}%;
  background-color: ${(props) => props.$color};
  transition: width 0.5s ease-in-out;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--background);
  width: 400px;
  border-radius: 12px;
  padding: 24px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: var(--fontHd);
  color: var(--font);
  font-weight: var(--bold);
`;

const CloseIcon = styled.button`
  font-size: 20px;
  color: var(--font2);
  transition: color 0.2s;

  &:hover {
    color: var(--error);
  }
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
    box-shadow: 0 0 0 3px rgba(44, 59, 161, 0.1);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const CancelButton = styled.button`
  padding: 10px 16px;
  border: 1px solid var(--border);
  background-color: var(--background);
  color: var(--font);
  border-radius: 6px;
  font-weight: var(--bold);
  font-size: var(--fontSm);

  &:hover {
    background-color: var(--background2);
  }
`;

const SubmitButton = styled.button`
  padding: 10px 16px;
  background-color: var(--main);
  color: var(--font3);
  border: none;
  border-radius: 6px;
  font-weight: var(--bold);
  font-size: var(--fontSm);

  &:hover {
    background-color: #1e2a82;
  }
`;

const AlertModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const AlertModalContent = styled.div`
  background-color: var(--background);
  width: 400px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow);
  border: 2px solid var(--border);
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;

  align-items: center;
  margin-bottom: 20px;
`;

const WarningIcon = styled.span`
  font-size: 24px;
  animation: ${blink} 1s linear infinite;
`;

const AlertTitle = styled.h3`
  margin: 0;
  margin-top: 5px;
  font-size: var(--fontLg);
  color: var(--error);
  font-weight: var(--bold);
`;

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
  max-height: 200px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--error);
    border-radius: 3px;
  }
`;

const AlertItem = styled.div`
  font-size: var(--fontSm);
  color: var(--error);
  font-weight: var(--bold);
  min-height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bgError);
  padding: 12px 16px;
  border-radius: 8px;
`;

const AlertButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: var(--error);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: var(--fontSm);
  font-weight: var(--bold);
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;
