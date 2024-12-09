/* globals zoomSdk */
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
// import Button from '@salesforce/design-system-react/components/button';
import { useCallback, useEffect, useState } from "react";
import { apis } from "./apis";
import { CrmInfo } from "./components/CrmInfo";
import { Authorization } from "./components/Authorization";
import ApiScrollview from "./components/ApiScrollview";
// import { authorize } from "./zoomEndpoints";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

let once = 0; // to prevent increasing number of event listeners being added

function App() {
  // const history = useNavigate();
  // const location = useLocation();
  const [isRendered, setIsRendered] = useState(false);
  //let isRendered = false;
  const [error, setError] = useState(null);
  // const [user, setUser] = useState(null);
  const [runningContext, setRunningContext] = useState(null);
  const [isCrmConnected, setIsCrmConnected] = useState(null);
  const [consumer, setConsumer] = useState(null);
  const [user, setUser] = useState(null);
  // const [engagementContext, setEngagementContext] = useState(null);
  // const [currentEngagementId, setEngagementId] = useState(null);
  // const [data, setData] = useState(null);
  // const [configResponse, setConfigResponse] = useState(null);
  // const [counter, setCounter] = useState(0);
  // const [userContextStatus, setUserContextStatus] = useState("");
  // const [searchParams, setSearchParams] = useSearchParams();


    async function configureSdk() {
      setIsRendered(true);
      console.log('!!!!! WHY FIRE A LOT OF TIME')
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
        // setConfigResponse(JSON.stringify(configResponse));
        console.log("App configured", configResponse);
        // The config method returns the running context of the Zoom App
        
        // setUserContextStatus(configResponse.auth.status);
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
        if (configResponse.runningContext === 'inContactCenter') {
          const engagementResponse = await zoomSdk.getEngagementContext();
          const engagementFullResponse = await (await fetch(`/api/zoomapp/getEngagementInfo?engagementId=${engagementResponse.engagementContext.engagementId}`)).json();
          console.log('!!!! engagementFullResponse', engagementFullResponse);
          setConsumer(engagementFullResponse.consumers[0]);

        }
        const userResponse = await fetch("/zoom/api/v2/users/me");
        const user = await userResponse.json();
        const isCrmInstalledResponse = await (await fetch(`/api/zoomapp/isCrmInstalled?accountId=${user.account_id}`)).json();
        setIsCrmConnected(isCrmInstalledResponse.result);
        setRunningContext(configResponse.runningContext);
        setUser(user);
        console.log('!!! CRM:', isCrmInstalledResponse.result);
      } catch (error) {
        console.log(error);
        setError("There was an error configuring the JS SDK");
      }
    }

    if (!isRendered) {
      configureSdk();
    }
    

    // useEffect(() => {
    //   //console.log('!!!!!!!!!!!!!! currentUserStatus:', searchParams.get('currentUserStatus'));
    // }, [searchParams]);

  if (error) {
    console.log(error);
    return (
      <div className="App">
        <h1>{error.message}</h1>
      </div>
    );
  }
  if (runningContext === 'inMainClient' && isCrmConnected) {
    return (
      <div className="App">
          Already Connected
      </div>
    )
  } else if (runningContext === 'inMainClient' && !isCrmConnected) {
    return (
      <div className="App">
          Need to connect CRM
      </div>
    );
  } else if (runningContext === 'inContactCenter' && isCrmConnected) {
    return (
        <div className="App">
            <CrmInfo 
              consumer={consumer}
              zoomAccountId={user.account_id}
            />
        </div>
    );
  }
}

export default App;

