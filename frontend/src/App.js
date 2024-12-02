/* globals zoomSdk */
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { apis } from "./apis";
import { Authorization } from "./components/Authorization";
import { AuthHubspotUser } from "./components/AuthHubspotUser";
import ApiScrollview from "./components/ApiScrollview";
// import { authorize } from "./zoomEndpoints";

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
  const [currentEngagementId, setEngagementId] = useState(null);
  const [data, setData] = useState(null);
  const [configResponse, setConfigResponse] = useState(null);
  const [counter, setCounter] = useState(0);
  const [userContextStatus, setUserContextStatus] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();


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
            "onEngagementMediaRedirect",
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

        zoomSdk.onEngagementContextChange((data) => {
          console.log('!!!! New Engagement Context:', data);
        });

        zoomSdk.onEngagementMediaRedirect((data) => {
          console.log('!!!! New onEngagementMediaRedirect:', data);
        });
        
        zoomSdk.onAuthorized((data) => {
          console.log('!!!! New onAuthorized:', data);
        });
        if (configResponse.runningContext !== 'inMainClient') {
          const engagementResponse = await zoomSdk.getEngagementContext();
          console.log('!!!! engagementResponse:', engagementResponse.engagementContext);
          setEngagementContext(engagementResponse.engagementContext);
          setEngagementId(engagementResponse.engagementContext.engagementId);

          const engVariablesResponse = await zoomSdk.getEngagementVariableValue({engagementId: engagementResponse.engagementContext.engagementId});
          console.log('!!!! engagementVars:', engVariablesResponse);

          //const userResponse = await (await fetch(`/zoom/api`));
          //console.log('!!!! userResponse', userResponse);
          const engagementFullResponse = await (await fetch(`/api/zoomapp/getEngagementInfo?engagementId=${engagementResponse.engagementContext.engagementId}`)).json();
          console.log('!!!! engagementFullResponse', engagementFullResponse);
        }
        

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

  useEffect(() => {
    console.log('!!!!!!!!!!!!!! currentUserStatus:', searchParams.get('currentUserStatus'));
  }, [searchParams]);


  if (error) {
    console.log(error);
    return (
      <div className="App">
        <h1>{error.message}</h1>
      </div>
    );
  }
  // if (configResponse.runningContext === 'inMainClient') {
    return (
      <div className="App">
        <AuthHubspotUser />
      </div>
    )
  // } 
  // else {
  //   return (
  //     <div className="App">
        
  //         <h1>{`EngagementId: ${currentEngagementId}`}</h1>
  //       </div>
  //   );
  // }
  
}

export default App;

