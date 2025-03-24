import React from 'react'
import io from "socket.io-client";
import { useEffect, useState } from 'react';



const Socket = () => {
 const  [socket, setSocket] = useState(null)

    useEffect(() => {
        const newSocket = io(`${import.meta.env.VITE_URL}`);
        setSocket(newSocket);
        console.log('socket')
    
        return () => {
          newSocket.disconnect();
        };
      }, []);
  return (
    <div>
      z
    </div>
  )
}

export default Socket
