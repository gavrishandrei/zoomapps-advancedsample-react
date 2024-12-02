/* globals zoomSdk */
import { useEffect, useCallback, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";

function AuthHubspotUser() {
    const pubspotInstall = async () => {
        zoomSdk.openUrl({
            url: 'https://46f3d98d5825.ngrok.app/api/zoomapp/installHubspot',
        });
    };

    return (
        <div>
            <Button
                style={{ marginTop: "15px", float: "right" }}
                variant="danger"
                onClick={pubspotInstall}
            >
                HubSpot Install
            </Button>
        </div> 
      );
}

export default AuthHubspotUser;