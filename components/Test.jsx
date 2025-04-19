import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Peer } from 'peerjs';
import { useSocket } from "../src/context/SocketContext"

export default function BasicModal() {
  const {socket} = useSocket();
  const [peer, setPeer] = useState(null);
  const [peerId, setPeerId] = useState('');
  
  // Generate a consistent user ID
  const getUserId = () => {
    // Check if we have a stored user ID
    let storedUserId = localStorage.getItem('persistentPeerId');
    
    if (!storedUserId) {
      // Generate a new ID if not exists
      storedUserId = `user-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('persistentPeerId', storedUserId);
    }
    
    return storedUserId;
  };

  useEffect(() => {
    const persistentUserId = getUserId();

    // Create Peer with a fixed ID
    const newPeer = new Peer(persistentUserId, {
      secure: true,
      debug: 3,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
        ]
      }
    });

    newPeer.on('open', (id) => {
      console.log('Persistent Peer ID:', id);
      setPeerId(id);
      setPeer(newPeer);
    });

    newPeer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });

    // Cleanup
    return () => {
      if (newPeer) {
        newPeer.destroy();
      }
    };
  }, []); 

  return (
    <div>Persistent Peer ID: {peerId}</div>
  );
}