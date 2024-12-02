/* globals zoomSdk */
const authorize = async () => {
  console.log("Authorize flow begins here");
  console.log("1. Get code challenge and state from backend . . .");
  let authorizeResponse;
  try {
    authorizeResponse = await (await fetch("/api/zoomapp/authorize")).json();
    console.log(authorizeResponse);
    if (!authorizeResponse || !authorizeResponse.codeChallenge) {
      console.error(
        "Error in the authorize flow - likely an outdated user session.  Please refresh the app"
      );
      return;
    }
  } catch (e) {
    console.error(e);
  }
  const { codeChallenge, state } = authorizeResponse;

  console.log("1a. Code challenge from backend: ", codeChallenge);
  console.log("1b. State from backend: ", state);

  const authorizeOptions = {
    codeChallenge: codeChallenge,
    state: state,
  };
  console.log("2. Invoke authorize, eg zoomSdk.authorize(authorizeOptions)");
  try {
    const zoomAuthResponse = await zoomSdk.authorize(authorizeOptions);
    console.log(zoomAuthResponse);
    return zoomAuthResponse;
  } catch (e) {
    console.error(e);
  }
};


module.exports = { authorize }
