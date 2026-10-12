// WebRTC Peer Connection & Real-Time Signaling Client for EchoLytix Accessible Video Call

export interface PeerInfo {
  peerId: string;
  userId: string;
  userName: string;
}

export interface CallMessagePayload {
  id?: string;
  call_id: string;
  sender_name: string;
  sender_role: 'local' | 'remote';
  method: string;
  text: string;
  timestamp?: string;
}

export interface IncomingCallEvent {
  callId: string;
  caller: {
    id: string;
    name: string;
    phone?: string;
    avatar_initials?: string;
  };
  callType?: string;
}

export interface CallRingingEvent {
  callId: string;
  recipient: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface WebRTCClientCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onPeerJoined?: (peer: PeerInfo) => void;
  onPeerLeft?: (peerId: string) => void;
  onIncomingCall?: (event: IncomingCallEvent) => void;
  onCallRinging?: (event: CallRingingEvent) => void;
  onCallAccepted?: (data: { callId: string; recipientId?: string; recipientName?: string }) => void;
  onCallRejected?: (data: { callId: string; reason?: string }) => void;
  onCallCancelled?: (data: { callId: string }) => void;
  onCallFailed?: (data: { callId?: string; error: string }) => void;
  onCallConnected?: () => void;
  onCallEnded?: (reason: string) => void;
  onTranscriptMessage?: (msg: CallMessagePayload) => void;
  onCommunicationModeChange?: (mode: string) => void;
  onAudioLevel?: (level: number) => void; // 0.0 to 1.0 for audio wave meter
  onError?: (err: Error) => void;
}

export class WebRTCClient {
  private pc: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private originalVideoTrack: MediaStreamTrack | null = null;
  private iceCandidateQueue: RTCIceCandidateInit[] = [];

  private callId: string = '';
  private userId: string = '';
  private userName: string = '';
  private sessionToken: string | null = null;
  private callbacks: WebRTCClientCallbacks = {};

  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isMuted: boolean = false;
  private isCameraOff: boolean = false;
  private currentFacingMode: 'user' | 'environment' = 'user';
  private iceServersCache: RTCIceServer[] | null = null;

  constructor(callbacks: WebRTCClientCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: WebRTCClientCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // 1. Establish Signaling Connection for User Presence & Incoming Calls
  public connectSignaling(userId: string, userName: string, sessionToken?: string | null) {
    this.userId = userId;
    this.userName = userName;
    this.sessionToken = sessionToken || null;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // Already connected or connecting, send register
      if (this.ws.readyState === WebSocket.OPEN) {
        this.sendWs({
          type: 'user:register',
          userId: this.userId,
          userName: this.userName,
          token: this.sessionToken,
        });
      }
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const tokenParam = this.sessionToken ? `?token=${encodeURIComponent(this.sessionToken)}` : `?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;
      const wsUrl = `${protocol}//${window.location.host}/ws/call${tokenParam}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.sendWs({
          type: 'user:register',
          userId: this.userId,
          userName: this.userName,
          token: this.sessionToken,
        });
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          await this.handleSignalingMessage(data);
        } catch (err) {
          console.warn('[WebRTC Client WS Msg Error]:', err);
        }
      };

      this.ws.onerror = (e) => {
        console.warn('[WebRTC Client WS Error]:', e);
      };

      this.ws.onclose = () => {
        // Reconnect after 3 seconds if not deliberately closed
        setTimeout(() => {
          if (this.userId && (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
            this.connectSignaling(this.userId, this.userName, this.sessionToken);
          }
        }, 3000);
      };
    } catch (e) {
      console.warn('[WebRTC] Signaling connection failed to initialize:', e);
    }
  }

  private sendWs(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // 2. Fetch ICE Servers configuration (STUN / TURN)
  private async getIceServers(): Promise<RTCIceServer[]> {
    if (this.iceServersCache && this.iceServersCache.length > 0) {
      return this.iceServersCache;
    }
    let servers: RTCIceServer[] = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    ];
    try {
      const res = await fetch('/api/calls/ice-servers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          servers = data.iceServers;
        }
      }
    } catch (e) {
      console.warn('[WebRTC] Could not fetch ICE servers from backend, falling back to Google STUN:', e);
    }
    this.iceServersCache = servers;
    return servers;
  }

  // 3. Acquire Local Media Tracks
  public async startLocalMedia(options: { video?: boolean; audio?: boolean; facingMode?: 'user' | 'environment' } = {}) {
    const { video = true, audio = true, facingMode = 'user' } = options;
    this.currentFacingMode = facingMode;

    try {
      if (this.localStream) {
        this.stopLocalMedia();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: video
          ? {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : false,
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      });

      this.localStream = stream;
      this.callbacks.onLocalStream?.(stream);

      // Start Audio Activity Analyzer for Visual Meter
      this.startAudioAnalyzer(stream);

      return stream;
    } catch (err: any) {
      console.warn('[WebRTC] getUserMedia failed or was rejected:', err);
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  // 4. Initialize RTCPeerConnection
  private async setupPeerConnection(callId: string) {
    this.callId = callId;
    if (this.pc) {
      try {
        this.pc.close();
      } catch (e) {}
      this.pc = null;
    }

    this.iceCandidateQueue = [];
    const iceServers = await this.getIceServers();
    this.pc = new RTCPeerConnection({ iceServers });
    this.remoteStream = new MediaStream();

    // Attach local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });
    }

    // Remote Track Listener
    this.pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (this.remoteStream && !this.remoteStream.getTracks().includes(track)) {
          this.remoteStream.addTrack(track);
        }
      });
      if (this.remoteStream) {
        this.callbacks.onRemoteStream?.(this.remoteStream);
      }
    };

    // ICE Candidate Generator
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendWs({
          type: 'ice-candidate',
          callId: this.callId,
          candidate: event.candidate,
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc?.connectionState === 'connected') {
        this.callbacks.onCallConnected?.();
      } else if (this.pc?.connectionState === 'failed' || this.pc?.connectionState === 'disconnected') {
        console.warn('[WebRTC] Connection state changed:', this.pc?.connectionState);
      }
    };
  }

  // 5. Initiate an Outgoing Call
  public initiateCall(params: { phone?: string; recipientId?: string; callType?: string }) {
    this.sendWs({
      type: 'call:initiate',
      phone: params.phone,
      recipientId: params.recipientId,
      callType: params.callType || 'video',
    });
  }

  // 6. Accept an Incoming Call
  public async acceptCall(callId: string) {
    this.callId = callId;
    this.sendWs({
      type: 'call:accept',
      callId,
    });
    // Join WebRTC room
    await this.joinCall(callId, this.userId, this.userName);
  }

  // 7. Reject an Incoming Call
  public rejectCall(callId: string, reason: string = 'declined') {
    this.sendWs({
      type: 'call:reject',
      callId,
      reason,
    });
  }

  // 8. Cancel an Outgoing Call
  public cancelCall(callId: string) {
    this.sendWs({
      type: 'call:cancel',
      callId,
    });
  }

  // 9. Join Call Room for Peer-to-Peer Streaming
  public async joinCall(callId: string, userId?: string, userName?: string) {
    this.callId = callId;
    if (userId) this.userId = userId;
    if (userName) this.userName = userName;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectSignaling(this.userId, this.userName, this.sessionToken);
      // Wait for socket to open if needed
      await new Promise<void>((resolve) => {
        if (!this.ws || this.ws.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }
        const prevOpen = this.ws.onopen;
        this.ws.onopen = (e) => {
          if (prevOpen) prevOpen.call(this.ws, e);
          resolve();
        };
      });
    }

    await this.setupPeerConnection(callId);

    this.sendWs({
      type: 'join-call',
      callId,
      userId: this.userId,
      userName: this.userName,
    });
  }

  // 10. Handle Incoming Signaling Messages
  private async handleSignalingMessage(data: any) {
    switch (data.type) {
      // Inbound call
      case 'call:incoming': {
        this.callbacks.onIncomingCall?.({
          callId: data.callId,
          caller: data.caller,
          callType: data.callType,
        });
        break;
      }

      // Ringing state
      case 'call:ringing': {
        this.callbacks.onCallRinging?.({
          callId: data.callId,
          recipient: data.recipient,
        });
        break;
      }

      // Call accepted by recipient
      case 'call:accepted': {
        this.callbacks.onCallAccepted?.(data);
        if (data.callId && data.callId !== this.callId) {
          this.callId = data.callId;
        }
        // If caller, enter call room
        if (this.callId) {
          await this.joinCall(this.callId, this.userId, this.userName);
        }
        break;
      }

      // Call rejected
      case 'call:rejected': {
        this.callbacks.onCallRejected?.({
          callId: data.callId,
          reason: data.reason || 'Call rejected',
        });
        break;
      }

      // Call cancelled by caller
      case 'call:cancelled': {
        this.callbacks.onCallCancelled?.({
          callId: data.callId,
        });
        break;
      }

      // Call failed (e.g. offline or unregistered)
      case 'call:failed': {
        this.callbacks.onCallFailed?.({
          callId: data.callId,
          error: data.error || 'Call could not be completed',
        });
        break;
      }

      // Room joined
      case 'joined-call': {
        if (Array.isArray(data.existingPeers) && data.existingPeers.length > 0) {
          // We are joining an existing peer, initiate SDP offer
          await this.createAndSendOffer();
        }
        break;
      }

      // Remote peer entered room
      case 'peer-joined': {
        this.callbacks.onPeerJoined?.({
          peerId: data.peerId,
          userId: data.userId,
          userName: data.userName,
        });
        // The newly joined peer can either receive an offer or send one
        break;
      }

      case 'peer-left': {
        this.callbacks.onPeerLeft?.(data.peerId);
        break;
      }

      // SDP Offer received
      case 'call:offer':
      case 'sdp-offer': {
        if (!this.pc) {
          await this.setupPeerConnection(data.callId || this.callId);
        }
        if (!this.pc) return;

        const offer = data.offer || data.sdp;
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        await this.flushIceCandidateQueue();

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        this.sendWs({
          type: 'sdp-answer',
          callId: this.callId,
          answer,
        });
        break;
      }

      // SDP Answer received
      case 'call:answer':
      case 'sdp-answer': {
        if (!this.pc) return;
        const answer = data.answer || data.sdp;
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
        await this.flushIceCandidateQueue();
        break;
      }

      // ICE Candidate received
      case 'call:ice-candidate':
      case 'ice-candidate': {
        if (!data.candidate) return;
        if (this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.warn('[WebRTC] addIceCandidate error:', err);
          }
        } else {
          // Queue ICE candidate until remote description is set
          this.iceCandidateQueue.push(data.candidate);
        }
        break;
      }

      case 'call:connected': {
        this.callbacks.onCallConnected?.();
        break;
      }

      case 'transcript-message': {
        if (data.message) {
          this.callbacks.onTranscriptMessage?.(data.message);
        }
        break;
      }

      case 'communication-mode': {
        if (data.mode) {
          this.callbacks.onCommunicationModeChange?.(data.mode);
        }
        break;
      }

      case 'call-ended':
      case 'call:ended': {
        this.callbacks.onCallEnded?.(data.reason || 'Call ended by remote participant');
        break;
      }
    }
  }

  // Flush queued ICE candidates
  private async flushIceCandidateQueue() {
    if (!this.pc) return;
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      if (candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] Queued addIceCandidate error:', err);
        }
      }
    }
  }

  private async createAndSendOffer() {
    if (!this.pc) return;
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.sendWs({
        type: 'sdp-offer',
        callId: this.callId,
        offer,
      });
    } catch (err: any) {
      console.warn('[WebRTC] createOffer failed:', err);
      this.callbacks.onError?.(err);
    }
  }

  // 11. Audio Activity Meter via Web Audio API
  private startAudioAnalyzer(stream: MediaStream) {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 64;
      source.connect(this.audioAnalyser);

      const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);

      const checkVolume = () => {
        if (!this.audioAnalyser) return;
        this.audioAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1.0, avg / 128); // 0.0 to 1.0
        this.callbacks.onAudioLevel?.(normalized);

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('[WebRTC] Audio analyzer failed to start:', e);
    }
  }

  // 12. Media Controls
  public toggleMute(): boolean {
    if (!this.localStream) return this.isMuted;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });
    return this.isMuted;
  }

  public toggleCamera(): boolean {
    if (!this.localStream) return this.isCameraOff;
    this.isCameraOff = !this.isCameraOff;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = !this.isCameraOff;
    });
    return this.isCameraOff;
  }

  public async switchCamera(): Promise<string> {
    const nextMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    this.currentFacingMode = nextMode;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: nextMode } },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return this.currentFacingMode;

      // Replace track on peer connection
      if (this.pc) {
        const senders = this.pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      // Update localStream
      if (this.localStream) {
        const oldTrack = this.localStream.getVideoTracks()[0];
        if (oldTrack) {
          this.localStream.removeTrack(oldTrack);
          oldTrack.stop();
        }
        this.localStream.addTrack(newVideoTrack);
        this.callbacks.onLocalStream?.(this.localStream);
      }

      return nextMode;
    } catch (err) {
      console.warn('[WebRTC] Camera switch failed:', err);
      return this.currentFacingMode;
    }
  }

  // 13. Screen Share
  public async toggleScreenShare(): Promise<boolean> {
    if (this.screenStream) {
      // Stop Screen Sharing & restore camera
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;

      if (this.originalVideoTrack && this.pc) {
        const senders = this.pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(this.originalVideoTrack);
        }
      }
      return false;
    } else {
      // Start Screen Sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        this.screenStream = stream;
        const screenTrack = stream.getVideoTracks()[0];

        // Store original video track
        if (this.localStream) {
          this.originalVideoTrack = this.localStream.getVideoTracks()[0] || null;
        }

        if (this.pc && screenTrack) {
          const senders = this.pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          this.toggleScreenShare();
        };

        return true;
      } catch (err: any) {
        console.warn('[WebRTC] getDisplayMedia was cancelled or denied:', err);
        return false;
      }
    }
  }

  // 14. Capture Screenshot from Remote Video Stream
  public captureFrame(videoElement: HTMLVideoElement): string | null {
    if (!videoElement || videoElement.videoWidth === 0) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('[WebRTC] Capture frame error:', err);
      return null;
    }
  }

  // 15. Send Real-Time Messaging & Mode Changes
  public sendTranscriptMessage(msg: CallMessagePayload) {
    this.sendWs({
      type: 'transcript-message',
      message: msg,
    });
  }

  public sendCommunicationMode(mode: string) {
    this.sendWs({
      type: 'communication-mode',
      mode,
    });
  }

  public endCall(duration = 0, reason = 'User ended call') {
    this.sendWs({
      type: 'call-end',
      callId: this.callId,
      duration,
      reason,
    });
    this.leaveRoom();
  }

  public leaveRoom() {
    if (this.pc) {
      try {
        this.pc.close();
      } catch (e) {}
      this.pc = null;
    }
    this.remoteStream = null;
    this.iceCandidateQueue = [];
  }

  // 16. Cleanup & Teardown
  public stopLocalMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
      this.audioAnalyser = null;
    }
  }

  public close() {
    this.stopLocalMedia();
    this.leaveRoom();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }
}
