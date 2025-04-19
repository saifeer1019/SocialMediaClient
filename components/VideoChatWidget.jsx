import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Peer } from 'peerjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import '../src/App.css'
import { useSocket } from "../src/context/SocketContext"

const VideoChatWidget = () => {
    const { socket, callerId, setCallerId, videoCallStatus, setVideoCallStatus, peerId, setPeerId, peer, setStream, stream, uid, currentCall, setCurrentCall } = useSocket();
    const [isHovering, setIsHovering] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [userId, setUserId] = useState('');  
    const [remoteUserId, setRemoteUserId] = useState('');
    const myVideo = useRef();
    const userVideo = useRef();
    const [count, setCount] = useState(0)
    const style = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
  
      bgcolor: 'background.paper',
     
      boxShadow: 24,
      
    };    

    useEffect(() => {
            if (peerId && stream && peer){
              // Make the call with our media stream
        const call = peer.call(peerId, stream);

          
                      // Handle when they answer with their stream
                      call.on('stream', (remoteStream) => {
                      
                    if (userVideo.current) {
                      userVideo.current.srcObject = remoteStream;
                      console.log('srcObject set:', userVideo.current.srcObject);
                      };
                        console.log('setting video call status to accepted')
                      setVideoCallStatus('accepted')
                    })

                    call.on('close', () => {
                      call.close()})
                      setCurrentCall(call);
              
                }
   }, [peerId]);

   useEffect(() => {
    socket.on('reciever-peer', (pid) =>{
      console.log('peerid recieved', pid)
      setPeerId(pid)     
    })

   },[])
const hanldeClick= () =>{
  console.log('cure', currentCall)
}
   useEffect(() => {
 
      console.log('cur', currentCall)
         


   },[currentCall])

   const endCall = () => {
 console.log('closing call', callerId)
 if (callerId){
  socket.emit('call-closed', {to: callerId.from?._id})
 }




   currentCall.close();
   if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
   setStream(null)
   setVideoCallStatus('closed')
   
  // userVideo.current.srcObject = null

    
    if (remoteUserId) {
      socket.emit('call-ended', { to: remoteUserId });
    }
  }


   useEffect(() => {

if(currentCall){
  currentCall.on('stream', (remoteStream) => {
     if (userVideo.current) {
       userVideo.current.srcObject = remoteStream;
       console.log('srcObject set:', userVideo.current.srcObject);
       };
        // Handle call closing
    currentCall.on('close', () => {
      console.log('Call closed'); // Log call closing
     currentCall.close()
    });
    
    // Handle call errors
    currentCall.on('error', (err) => {
      console.error('Call error:', err);

      alert(`Call error: ${err.message}`);
    });
      })
}
   
    
   },[currentCall])
   useEffect(() => {
   console.log(' checking the stream')
   console.log('myvideo.current', myVideo.current)
    if (myVideo.current && stream) {
      console.log('Setting my video stream');
      myVideo.current.srcObject = stream;
    }
  }, [count]);

  useEffect(() => {
   setCount(1)
   socket.on('call-closed', () => {
    console.log('cur', currentCall)
    // if (myVideo.current) {
    //   myVideo.current.srcObject = null
    // }
    // if (userVideo.current) {
    //   userVideo.current.srcObject = null
    // }

  
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }


   
    setVideoCallStatus('closed')
    
  })
   }, [count])


  return (
    <div className="relative">
    <div className="absolute h-screen w-screen z-20">
      <Modal
        open={(videoCallStatus === 'calling' || videoCallStatus === 'accepted')}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="flex items-center justify-center h-full w-full">
          {/* Main User Video (Large) */}
         <div 
            className="relative w-full md:w-4/5 lg:w-3/4 max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          
          >
          <div className={`absolute ${(videoCallStatus =='accepted') ? 'hidden': 'hfbdj'} text-4xl md:text-7xl bottom-[50%] right-[50%] translate-[50%] text-white`}>Calling...</div>
            {/* User Video */}
            <video
              playsInline
              ref={userVideo}
              autoPlay
              className="w-full h-full object-cover"
              style={{ display: (videoCallStatus =='accepted') ? 'block' : 'none' }}
            />

            {/* Controls that appear on hover */}
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${
                isHovering ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex justify-center gap-6">
                {/* End Call Button */}
                <button 
                  onClick={endCall}
                  className="bg-red-600 hover:bg-red-700 text-red-600 p-3 rounded-full transition-colors"
                >
                  <CallEndIcon style={{ fontSize: 24 }} />
                </button>
                
                {/* Mute Button */}
                <button 
               
                  className="bg-gray-700 hover:bg-gray-800 text-gray-700 p-3 rounded-full transition-colors"
               
                >
                  {isMuted ? <MicOffIcon style={{ fontSize: 24 }} /> : <MicIcon style={{ fontSize: 24 }} />}
                </button>
                
                {/* Add Participant Button */}
                <button 
        
                  className="bg-gray-700 hover:bg-gray-800 text-gray-700 p-3 rounded-full transition-colors"
                  onClick={hanldeClick}
                  >
                  <PersonAddIcon style={{ fontSize: 24 }} />
                </button>
              </div>
            </div>

            {/* My Video (Small overlay) */}
          <div className="absolute bottom-4 right-4 w-1/4 md:w-1/5 lg:w-1/6  aspect-[9/16] md:aspect-video bg-gray-800 rounded-md overflow-hidden shadow-lg">
              <video
                playsInline
                muted
                ref={myVideo}
                autoPlay
                className="w-full h-full object-cover"
             
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </div>
  )
}

export default VideoChatWidget
