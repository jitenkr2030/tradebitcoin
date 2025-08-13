import { store } from '../store/store';
import { updateMarketData } from '../store/slices/tradingSlice';
import { addError } from '../store/slices/errorSlice';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000;
  private subscriptions: Set<string> = new Set();

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.resubscribe();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      store.dispatch(addError({
        message: 'WebSocket connection error',
        type: 'error'
      }));
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      store.dispatch(addError({
        message: 'Failed to reconnect to WebSocket server',
        type: 'error'
      }));
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'PRICE_UPDATE':
        store.dispatch(updateMarketData(data.data));
        break;
      // Add more message type handlers as needed
    }
  }

  subscribe(channel: string, params: any = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.subscriptions.add(JSON.stringify({ channel, params }));
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'SUBSCRIBE',
      channel,
      params
    }));
  }

  private resubscribe() {
    for (const sub of this.subscriptions) {
      const { channel, params } = JSON.parse(sub);
      this.subscribe(channel, params);
    }
  }

  unsubscribe(channel: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      type: 'UNSUBSCRIBE',
      channel
    }));

    this.subscriptions.delete(channel);
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new WebSocketService('ws://localhost:8080');