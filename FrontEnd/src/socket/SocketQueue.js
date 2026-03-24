// SocketQueue.js
class SocketQueue {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.queue = [];
    this.isConnected = false;
    this.listeners = []; // 메시지 수신 시 호출할 콜백들
  }

  // 소켓 연결
  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
    };

    this.socket.onmessage = (event) => {
      // 받은 메시지를 큐에 저장
      this.queue.push(event.data);

      // 등록된 리스너들에게 알림
      this.listeners.forEach((callback) => callback(event.data));
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // 메시지 하나 꺼내오기
  getMessage() {
    return this.queue.length > 0 ? this.queue.shift() : null;
  }

  // 모든 메시지 꺼내오기
  getAllMessages() {
    const messages = [...this.queue];
    this.queue = [];
    return messages;
  }

  // 큐 비우기
  clearMessages() {
    this.queue = [];
  }

  // 외부에서 메시지 수신 콜백 등록
  onMessage(callback) {
    this.listeners.push(callback);
  }
}

export default SocketQueue;