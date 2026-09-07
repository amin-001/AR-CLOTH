
/**
 * AvatarCanvas Component
 *
 * This component integrates with Ready Player Me's Avatar Creator to allow users
 * to create and customize 3D avatars. It handles the avatar creation process,
 * listens for events from the iframe, and navigates to the avatar details page
 * once creation is complete.
 *
 * Key Features:
 * - Embeds Ready Player Me avatar creator iframe
 * - Handles avatar export events
 * - Manages user authorization and asset unlocking
 * - Redirects to avatar details page after creation
 */

import {
  AssetUnlockedEvent,
  // AvatarCreator,
  // AvatarCreatorConfig,
  AvatarCreatorEvent,
  AvatarCreatorRaw,
  // AvatarExportedEvent,
  UserAuthorizedEvent,
  UserSetEvent,
} from "@readyplayerme/react-avatar-creator";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AvatarCreator, AvatarCreatorConfig, AvatarExportedEvent } from '@streamoji/react-avatar-creator';

// Configuration for the avatar creator
// const config = {
//   clearCache: true,
//   bodyType: "fullbody",
//   quickStart: false,
//   language: "en",
// };

const config: AvatarCreatorConfig = {
  bodyType: 'Full',
  thumbnail: true,
  saveConfirm: true,
  whiteLabelTitle: 'adilazad46gmailcom',
  whiteLabelColor: '#BB86FC',
};


// Styling for the iframe container
const style = { width: "100%", height: "100vh", border: "none", margin: 0 };

function AvatarCanvas() { 
  // State for storing avatar details and tokens
  const [avatarDetails, setAvatarDetails] = useState<any>(null);
  const [token, setToken] = useState<any>(null);
  

  // Navigation hook
  const navigate = useNavigate();

  // Listen for messages from the Ready Player Me iframe
  useEffect(() => {
    getToken(); // Fetch token on component mount
    const handleMessage = (event: MessageEvent) => {
      // Security check - only accept messages from Ready Player Me domain
      if (event.origin !== "https://ar-2lgj3b.readyplayer.me") return;

      console.log("RAW EVENT:", event.data);

      // Handle asset change events
      if (event.data?.eventName === "rpm:assetChanged") {
        console.log("ASSET CHANGED:", event.data.data);
      }
    };

    // Add event listener for postMessage events
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Function to fetch avatar details from backend (currently commented out)
  const fetchAvatarDetails = async (avatarId: string) => {
     try {
    const response = await fetch(`http://localhost:5000/api/avatar/${avatarId}`);
    const data = await response.json();
    console.log("Avatar details:", data);
    setAvatarDetails(data);
  } catch (error) {
    console.error("Error fetching avatar details:", error);
  }
  };

  // Handler for when avatar is exported/created
  // const handleOnAvatarExported = async (event: AvatarExportedEvent) => {
  //   console.log(`Avatar URL is:`, event );
  //   const avatarUrl = event.data.url;
  //   // Extract avatar ID from URL
  //   const avatarId = avatarUrl.split("/").pop()?.split(".")[0];
  //   // Note: fetchAvatarDetails could be called here if needed

  //   // Navigate to dashboard with avatar ID after a delay
  //   setTimeout(() => {
  //   navigate('/dashboard', { state: { avatarId } });
  //   }, 5000);
  // };

  // Handler for user authorization events
  const handleOnUserSet = (event: UserSetEvent) => {
    console.log(`User ID is: ${event.data.id}`);
  };

  // Handler for user authorization
  const handleUserAuthorized = (event: UserAuthorizedEvent) => {
    console.log(`User is:`, event.data);
    // Could store token here: setToken(event.data.token);
  };

  // Handler for asset unlock events
  const handleAssetUnlocked = (event: AssetUnlockedEvent) => {
    console.log(`Asset unlocked is: ${event.data.assetId}`);
  };

  // const handleEvent = async (event: AvatarCreatorEvent) => {
  //   console.log('🛰️ Received event:', event);

  //   // You can now detect which event it is
  //   switch (event.name) {
  //     case 'v1.avatar.exported':
  //       console.log('✅ Avatar Exported URL:', event.data);
  //       const token = await getReadyPlayerToken('6911c2294a1ba3a647c2ec31');
  //       console.log('🪙 Ready Player Token:', token);
  //       const avatarDetails = await getAvatarDetails(event.data.id, token);
  //       console.log('🧑‍🎨 Avatar Details:', avatarDetails);

  //       navigate('/dashboard');
  //       break;
  //     case 'userAuthorized':
  //       console.log('🔐 User Authorized:', event.data);
  //       break;
  //     default:
  //       console.log('ℹ️ Other Event:', event.name);
  //       break;
  //   }
  // };

  // getReadyPlayerToken.js
// const getReadyPlayerToken = async (userId: any) => {
//   const PARTNER = "ar-2lgj3b";

//   const url = `https://api.readyplayer.me/v1/auth/token?userId=${userId}&partner=${PARTNER}`;

//   const response = await fetch(url, {
//     method: "GET",
//     headers: {
//       "x-api-key": API_KEY,
//     },
//   });

//   const data = await response.json();
//   if (!response.ok) throw new Error(data?.message || "Failed to get token");

//   return data.data.token; // short-lived token
// };


// getAvatarDetails.js
 const getAvatarDetails = async (avatarId: any, token: any) => {
  const API_KEY = import.meta.env.VITE_READY_PLAYER_ME_API_KEY;

  const response = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      // "x-api-key": API_KEY,
      "Content-Type": "application/json",
      "Origin": "https://ar-2lgj3b.readyplayer.me",
      "Referer": "https://ar-2lgj3b.readyplayer.me/",
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Failed to fetch avatar");

  return data; // includes "assets" object
  };

 const handleOnAvatarExported = (data: AvatarExportedEvent) => {
    // console.log(`Avatar URL: ${event.data.url}`);
    console.log(`Avatar URL: `, data);
    // Extract avatar ID from URL
    // const avatarId = data?.url.split("/").pop()?.split(".")[0];
  //   // Note: fetchAvatarDetails could be called here if needed
    const avatarId = data?.avatarId; // Assuming avatarId is directly available in the event data
     console.log(`Extracted Avatar ID: ${avatarId}`);
     // fetchAvatarDetails(avatarId); // Optionally fetch details immediately
  //   // Navigate to dashboard with avatar ID after a delay
    setTimeout(() => {
    navigate('/dashboard', { state: { avatarId, token } });
    }, 5000);

  };

  const getToken = async () => {
    console.log(`getToken: `);
     try {
               

                const response = await fetch(
                    "https://us-central1-streamoji-265f4.cloudfunctions.net/getAuthToken",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Client-Secret": 'LpAYN3pVsXVLW2ULH46Bg67z0EpkYXPD',
                            "Client-Id": 'client_2v8LNdB29pUgDy6ClO9fwzkQNKT2',
                            //  "Client-Secret": 'Xn4YCu35yGrNWNvo2s6DJOEWvg7lwB2a',
                            // "Client-Id": 'client_0RZ0yMzgtBTu4F9mJqD7L3y2yjp1',
                        },
                        body: JSON.stringify({ userId: 'user_789', userName: 'John Doe' }),
                    }
                );

                const data = await response.json();
                console.log('Token response:', data);
                if (!data.success) {
                    throw new Error(data.error || "Auth token generation failed");
                }

                setToken(data.authToken);
                // tokenDisplay.innerText = 'Token: ' + authToken;
            } catch (error) {
                console.error('Error fetching token:', error);
                // tokenDisplay.innerText = 'Error: ' + error.message;
            }
        }

  
  return (
    // Full-screen container for the avatar creator
    <div style={{ display: "flex" }}>

      {/*============ Last On =============*/}

      {/* Main iframe container taking full viewport */}
      {/* <div style={{ width: "100vw", height: "100vh" }}>
        <AvatarCreator
          subdomain="ar-2lgj3b"  // Custom subdomain for the app
          config={config}  // Avatar creator configuration
          style={style}  // Full-screen styling
          onAvatarExported={handleOnAvatarExported}  // Handle avatar creation completion
          onUserAuthorized={handleUserAuthorized}  // Handle user login to RPM
          onAssetUnlock={handleAssetUnlocked}  // Handle premium asset unlocks
          onUserSet={handleOnUserSet}  // Handle user profile setup
          // onEventReceived={handleEvent}  // Alternative event handling (commented out)
        />
      </div> */}

      {/* ========================================================== */}
      {/* Commented out: Side panel for displaying selected assets
      <div style={{ width: "30vw", padding: "1rem", overflowY: "auto" }}>
        <h2>Selected Assets</h2>
        {avatarDetails ? (
          <ul>
            {avatarDetails.assets?.map((asset: any) => (
              <li key={asset.id}>
                <strong>{asset.name}</strong> ({asset.id})<br />
                Category: {asset.category}
                <br />
                URL: {asset.url}
              </li>
            ))}
          </ul>
        ) : (
          <p>No assets selected yet.</p>
        )}
      </div> */}

      {/* =============================================================== */}

      <AvatarCreator
      config={config} 
      style={{ width: '100%', height: '100vh', border: 'none' }} 
      onAvatarExported={handleOnAvatarExported}
      token={token && token}
    />

    

    </div>
  );

}
export default AvatarCanvas;
