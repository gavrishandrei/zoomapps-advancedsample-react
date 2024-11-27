/* globals zoomSdk */
import { useLocation, useNavigate} from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { apis } from "./apis";
import { Authorization } from "./components/Authorization";
import ApiScrollview from "./components/ApiScrollview";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

let once = 0; // to prevent increasing number of event listeners being added

function App() {
  // const history = useNavigate();
  // const location = useLocation();
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [runningContext, setRunningContext] = useState(null);
  const [engagementContext, setEngagementContext] = useState(null);
  const [data, setData] = useState(null);
  const [configResponse, setConfigResponse] = useState(null);
  const [counter, setCounter] = useState(0);
  const [userContextStatus, setUserContextStatus] = useState("");

  useEffect(() => {
    async function configureSdk() {
      // to account for the 2 hour timeout for config
      const configTimer = setTimeout(() => {
        setCounter(counter + 1);
      }, 120 * 60 * 1000);

      try {
        // Configure the JS SDK, required to call JS APIs in the Zoom App
        // These items must be selected in the Features -> Zoom App SDK -> Add APIs tool in Marketplace
        const configResponse = await zoomSdk.config({
          capabilities: [
            // apis demoed in the buttons
            ...apis.map((api) => api.name), // IMPORTANT

            // demo events
            "onSendAppInvitation",
            "onShareApp",
            "onActiveSpeakerChange",
            "onMeeting",

            // connect api and event
            "connect",
            "onConnect",
            "postMessage",
            "onMessage",

            // in-client api and event
            "authorize",
            "onAuthorized",
            "promptAuthorize",
            "getUserContext",
            "onMyUserContextChange",
            "sendAppInvitationToAllParticipants",
            "sendAppInvitation",

            "onEngagementContextChange",
            "onEngagementStatusChange",

            "onPhoneCalleeAnswered",
            "onPhoneContext",
            "onPhoneCallerEnded",
            "onPhoneCalleeEnded",
            "onPhoneCalleeRejected"
          ],
          version: "0.16.0",
        });
        setConfigResponse(JSON.stringify(configResponse));
        console.log("App configured", configResponse);
        // The config method returns the running context of the Zoom App
        setRunningContext(configResponse.runningContext);
        setUserContextStatus(configResponse.auth.status);
        zoomSdk.onSendAppInvitation((data) => {
          console.log(data);
        });
        zoomSdk.onShareApp((data) => {
          console.log(data);
        });

        zoomSdk.onPhoneCalleeAnswered((data) => {
          console.log('!!!! Answered:', data);
        });

        zoomSdk.onPhoneContext((data) => {
          console.log('!!!! New PhoneContext:', data);
        });

        zoomSdk.onPhoneCallerEnded((data) => {
          console.log('!!!! onPhoneCallerEnded:', data);
        });

        zoomSdk.onPhoneCalleeEnded((data) => {
          console.log('!!!! onPhoneCalleeEnded:', data);
        });

        zoomSdk.onPhoneCalleeRejected((data) => {
          console.log('!!!! onPhoneCalleeRejected:', data);
        });

        zoomSdk.onEngagementStatusChange((data) => {
          console.log('!!!! New Engagement Status:', data);
        });
      } catch (error) {
        console.log(error);
        setError("There was an error configuring the JS SDK");
      }
      return () => {
        clearTimeout(configTimer);
      };
    }
    configureSdk();
  }, [counter]);


  if (error) {
    console.log(error);
    return (
      <div className="App">
        <h1>{error.message}</h1>
      </div>
    );
  }

  return (
    <div className="App">
        <h1>Hello{user ? ` ${user.first_name} ${user.last_name}` : " Zoom Apps user"}!</h1>
        <p>{`User Context Status: ${userContextStatus}`}</p>
        <p>
          {runningContext ?
            `Running Context: ${runningContext}` :
            "Configuring Zoom JavaScript SDK..."
          }
        </p>
        <p>{configResponse}</p>
        <p>{data}</p>

        <ApiScrollview />
      </div>
  );
}

export default App;

