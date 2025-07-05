import React, {useRef, useEffect} from 'react'
import { Peer } from 'peerjs';
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../../context/SocketContext"
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
const VideoCallNotification = ({u}) => {
  const {emitTyping, stopTyping, sendMessage, isTyping , socket, callerId, beingVideoCalledStatus, setStream, setCurrentCall, setPeer, setPeerId, peerId, videoCallStatus, setVideoCallStatus  } = useSocket();
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const user = useSelector((state) => state.user);
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };   

  const HandleCallRecieve = async () => {
  
  const stream_ = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

  console.log('Local stream:', stream_);
  setStream(stream_);

  // Initialize PeerJS with ICE servers
  const newPeer = new Peer(undefined, {
    secure: true,
  
  });
  let localPeerId = null

  newPeer.on('open', (id) => {
    console.log('My peer ID is:', id);


    setPeerId(id);
    setPeer(newPeer);
    localPeerId = id
    // Register with socket server
    console.log('emitting register with peer id', id)

    socket.emit('register-reciever-to', {reciever: id, caller: callerId.from._id} 
    );
    
  });
 



  if (localPeerId){
    console.log('local peer is set.... emitting')
 
    socket.on('reciever-registered', (c)=>{
      console.log('reciver registerd and sent dfkjgbj')

      setPeerId(c)
    });
  }
  newPeer.on('error', (err) => {
    console.error('PeerJS error:', err);
  });

  newPeer.on('call', (call) => {
    console.log('Incoming call from:', call.peer);
    call.answer(stream_)
    setCurrentCall(call);
    setVideoCallStatus('accepted')
  });





}

useSelector(()=>{


   



}, [peerId])
useEffect(() => {
  // Only play sound if we're being called
  if (videoCallStatus === 'beingCalled') {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      // Path to your sound file
      const sound = new Audio('/ringtone.mp3');
      sound.loop = true; // Makes the sound repeat
      audioRef.current = sound;
    }
    
    // Play the sound
    audioRef.current.play().catch(err => {
      console.error('Error playing sound:', err);
      // Many browsers require user interaction before playing audio
      // You might want to display a message to the user
    });
  }
  
  // Cleanup function to stop sound when component unmounts
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };
}, [videoCallStatus]);
const handleClose = () =>{
  setVideoCallStatus('')
  console.log(`${import.meta.env.VITE_URL}/assets/${callerId.from.pic}`)
}
  return (
    <Modal
    open={videoCallStatus === 'beingCalled'}
    onClose={handleClose}
    aria-labelledby="modal-modal-title"
    aria-describedby="modal-modal-description"
  >
  <Box 
  sx={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: {
      xs: '85%',    // On extra small screens (phones)
      sm: 350,      // On small screens and up
      md: 400,      // Optional: slightly wider on medium screens
      lg: 450       // Optional: even wider on large screens
    },
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: {
      xs: 2,        // Less padding on small screens
      sm: 4         // Original padding on larger screens
    },
    borderRadius: 2,
  }}
>
      <div className="flex flex-col items-center gap-4">
        {/* Caller Information */}
        <div className="flex flex-col items-center mb-2">
          {callerId.from.pic ? (
            <img 
              src={`${import.meta.env.VITE_URL}/assets/${callerId.from.pic}`} 
              alt={`${callerId.name}'s profile`} 
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-semibold">
              {callerId.from.firstName?.charAt(0).toUpperCase()}
            </div>
          )}
          <h3 className="text-lg font-semibold mt-2">{callerId.from.lastName}</h3>
          <p className="text-gray-600">is calling you...</p>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-4 w-full">
          <button
            className="flex-1  text-red-600 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
       
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Decline
          </button>
          <button
            className="flex-1 bg-blue-500 hover:bg-green-600 text-green-600 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 "
            onClick={HandleCallRecieve}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Answer
          </button>
        </div>
      </div>
    </Box>
  </Modal>
  )
}

export default VideoCallNotification
