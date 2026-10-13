import WebSocket from 'ws';
import http from 'http';

const SERVER_BASE = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/ws/call';

async function fetchJson(path: string, options: any = {}) {
  const url = `${SERVER_BASE}${path}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function createClient(userId: string, userName: string) {
  const ws = new WebSocket(`${WS_URL}?userId=${userId}&userName=${encodeURIComponent(userName)}`);
  const messages: any[] = [];
  
  const promise = new Promise<void>((resolve, reject) => {
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'user:register', userId, userName }));
      resolve();
    });
    ws.on('error', reject);
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      messages.push(msg);
    } catch (e) {}
  });

  const waitForMessage = (type: string, timeoutMs = 4000) => {
    return new Promise<any>((resolve, reject) => {
      const existing = messages.find(m => m.type === type);
      if (existing) return resolve(existing);

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out waiting for message "${type}". Received: ${JSON.stringify(messages.map(m => m.type))}`));
      }, timeoutMs);

      const handler = (raw: any) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === type) {
            cleanup();
            resolve(msg);
          }
        } catch (e) {}
      };

      const cleanup = () => {
        clearTimeout(timer);
        ws.off('message', handler);
      };

      ws.on('message', handler);
    });
  };

  return { ws, promise, messages, waitForMessage };
}

async function runTests() {
  console.log('--- STARTING VIDEO CALLING BACKEND E2E TEST ---');

  // 1. Phone number lookup tests
  console.log('\n[1] Testing Phone Number Lookup (/api/contacts/lookup)...');
  
  // Unregistered phone test
  const unregistered = await fetchJson('/api/contacts/lookup?phone=+12025550199');
  console.log('Unregistered lookup status:', unregistered.status);
  console.log('Unregistered lookup body:', unregistered.data);
  if (unregistered.status !== 404 || unregistered.data.error !== 'This number is not registered with EchoLytix.') {
    throw new Error('Unregistered phone lookup failed expected assertion');
  }
  console.log('✓ Unregistered number returned correct 404 and error message.');

  // Registered phone test
  const registered = await fetchJson('/api/contacts/lookup?phone=+918130896226');
  console.log('Registered lookup status:', registered.status);
  console.log('Registered lookup user:', registered.data.name, registered.data.phone);
  if (!registered.ok || !registered.data.registered || registered.data.name !== 'Saksham') {
    throw new Error('Registered phone lookup failed');
  }
  console.log('✓ Registered user Saksham looked up successfully.');

  // 2. Real-Time WebSocket Signaling & Calling Test
  console.log('\n[2] Connecting two WebSocket clients (Caller: Sachin id=1, Callee: Saksham id=2)...');
  const user1 = createClient('1', 'Sachin Gupta');
  const user2 = createClient('2', 'Saksham');

  await Promise.all([user1.promise, user2.promise]);
  console.log('✓ Both clients connected and registered presence.');

  // Wait a moment for presence registration
  await new Promise(r => setTimeout(r, 400));

  // Check presence endpoint
  const presenceRes = await fetchJson('/api/users/2/presence');
  console.log('Presence check for User 2 (Saksham):', presenceRes.data);
  if (presenceRes.data.presence !== 'online') {
    throw new Error('User 2 should be online');
  }
  console.log('✓ Saksham is detected online.');

  // 3. User 1 initiates call to Saksham's phone number +918130896226
  console.log('\n[3] User 1 initiating call to +918130896226...');
  user1.ws.send(JSON.stringify({
    type: 'call:initiate',
    phone: '+918130896226',
    callType: 'video'
  }));

  // Callee receives call:incoming
  console.log('Waiting for User 2 to receive call:incoming...');
  const incoming = await user2.waitForMessage('call:incoming');
  console.log('✓ User 2 received incoming call event:', incoming.callId, 'from:', incoming.caller.name);

  // Caller receives call:ringing
  console.log('Waiting for User 1 to receive call:ringing...');
  const ringing = await user1.waitForMessage('call:ringing');
  console.log('✓ User 1 received ringing event for callId:', ringing.callId);

  const activeCallId = incoming.callId;

  // 4. User 2 accepts the call
  console.log('\n[4] User 2 accepting the call...');
  user2.ws.send(JSON.stringify({
    type: 'call:accept',
    callId: activeCallId
  }));

  // User 1 receives call:accepted
  console.log('Waiting for User 1 to receive call:accepted...');
  const accepted = await user1.waitForMessage('call:accepted');
  console.log('✓ User 1 received call:accepted for callId:', accepted.callId);

  // 5. Both peers join the WebRTC call room
  console.log('\n[5] Both peers joining call room for WebRTC exchange...');
  user1.ws.send(JSON.stringify({
    type: 'join-call',
    callId: activeCallId,
    userId: '1',
    userName: 'Sachin Gupta'
  }));

  user2.ws.send(JSON.stringify({
    type: 'join-call',
    callId: activeCallId,
    userId: '2',
    userName: 'Saksham'
  }));

  const user1Joined = await user1.waitForMessage('joined-call');
  const user2Joined = await user2.waitForMessage('joined-call');
  console.log('✓ Both peers joined WebRTC room:', activeCallId);

  // 6. User 1 sends SDP Offer
  console.log('\n[6] Testing SDP Offer / Answer exchange...');
  const mockOffer = { type: 'offer', sdp: 'v=0\r\no=mock-caller 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
  user1.ws.send(JSON.stringify({
    type: 'sdp-offer',
    callId: activeCallId,
    offer: mockOffer
  }));

  const offerReceived = await user2.waitForMessage('sdp-offer');
  console.log('✓ User 2 received SDP Offer successfully.');

  // User 2 sends SDP Answer
  const mockAnswer = { type: 'answer', sdp: 'v=0\r\no=mock-callee 67890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
  user2.ws.send(JSON.stringify({
    type: 'sdp-answer',
    callId: activeCallId,
    answer: mockAnswer
  }));

  const answerReceived = await user1.waitForMessage('sdp-answer');
  console.log('✓ User 1 received SDP Answer successfully.');

  // 7. ICE candidate exchange
  console.log('\n[7] Testing ICE candidate exchange...');
  const mockCandidate = { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 };
  user1.ws.send(JSON.stringify({
    type: 'ice-candidate',
    callId: activeCallId,
    candidate: mockCandidate
  }));

  const candidateReceived = await user2.waitForMessage('ice-candidate');
  console.log('✓ User 2 received ICE Candidate successfully.');

  // 8. Transcript Message exchange
  console.log('\n[8] Testing Real-time Transcript Message exchange...');
  user1.ws.send(JSON.stringify({
    type: 'transcript-message',
    message: {
      call_id: activeCallId,
      sender_name: 'Sachin Gupta',
      sender_role: 'local',
      method: 'Sign',
      text: 'HELLO FROM WEBRTC TEST'
    }
  }));

  const transcriptReceived = await user2.waitForMessage('transcript-message');
  console.log('✓ User 2 received transcript message:', transcriptReceived.message.text);

  // 9. Call termination
  console.log('\n[9] Testing Call Termination...');
  user1.ws.send(JSON.stringify({
    type: 'call-end',
    callId: activeCallId,
    duration: 35,
    reason: 'Hang up'
  }));

  const endedReceived = await user2.waitForMessage('call-ended');
  console.log('✓ User 2 received call-ended event.');

  // 10. Check call record in DB
  console.log('\n[10] Verifying call history persistence in DB...');
  const callRecordRes = await fetchJson(`/api/calls/${activeCallId}`);
  console.log('Saved call record:', {
    id: callRecordRes.data.id,
    initiator_name: callRecordRes.data.initiator_name,
    recipient_name: callRecordRes.data.recipient_name,
    recipient_phone: callRecordRes.data.recipient_phone,
    status: callRecordRes.data.status,
    duration_seconds: callRecordRes.data.duration_seconds
  });

  if (!callRecordRes.ok || callRecordRes.data.recipient_phone !== '+918130896226') {
    throw new Error('Call record persistence failed');
  }
  console.log('✓ Call record correctly persisted in SQLite database.');

  // Close websockets
  user1.ws.close();
  user2.ws.close();

  console.log('\n==================================================');
  console.log('🎉 ALL CALL SIGNALLING & WEBRTC BACKEND TESTS PASSED!');
  console.log('==================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
