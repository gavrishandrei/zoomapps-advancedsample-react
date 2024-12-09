/* globals zoomSdk */
import { useEffect, useCallback, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";

function AuthHubspotUser(props) {
    const [redirectLink, setRedirectLink] = useState(null);

    console.log('!!!!! USER:', props.user);
    const pubspotInstall = async () => {
        zoomSdk.openUrl({
            url: `${process.env.REACT_APP_PUBLIC_ROOT}/api/zoomapp/installHubspot?accountId=${props.user.account_id}`,
        });
    };

    const generateCallbackLink = async () => {
        const redirectUrl = `${process.env.REACT_APP_PUBLIC_ROOT}/api/zoomapp/hubspotOauthCallback?accountId=${props.user.account_id}`
        setRedirectLink(redirectUrl)
    };

    return (
        <div>
            <p>{redirectLink}</p>
            <Button
                style={{ marginTop: "15px", float: "right" }}
                variant="success"
                onClick={generateCallbackLink}
            >
                Generate Redirect Link
            </Button>
            <Button
                style={{ marginTop: "15px", float: "right" }}
                variant="success"
                onClick={pubspotInstall}
            >
                HubSpot Install
            </Button>
        </div> 
      );
}

export default AuthHubspotUser;