import { React, useState } from 'react';
import Button from "react-bootstrap/Button";
import { apis, invokeZoomAppsSdk } from "../apis";
import "./ApiScrollview.css";

async function ApiScrollview() {
  // const [apiSearchText, setApiSearchText] = useState("");

  // const searchHandler = (e) => {
  //   let lowerCase = e.target.value.toLowerCase();
  //   setApiSearchText(lowerCase);
  // };

  // const filteredApis = apis?.filter((api) => {
  //   if (apiSearchText === '') {
  //     return api;
  //   } else {
  //     return api.name.toLowerCase().includes(apiSearchText);
  //   }
  // });
  // const engagementContextObject = { name: 'getEngagementContext'};
  // const engagementResponse = await zoomSdk.getEngagementContext({});

  return (
    <div className="api-scrollview">

    </div>
  )
}

export default ApiScrollview
