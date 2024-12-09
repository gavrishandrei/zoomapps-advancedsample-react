import { NavLink } from "react-router-dom";
// import { Button } from "@/components/ui/button"
// import { HStack } from "@chakra-ui/react"
import "./CrmInfo.css";

export const CrmInfo = (props) => {
  console.log('!!!! props', props);
  const {
    consumer_number,
    consumer_display_name
  } = props.consumer;
  const zoomAccountId = props.zoomAccountId;
  console.log('!!!! zoomAccountId', zoomAccountId);
  console.log('!!!! consumer_number', consumer_number);
  console.log('!!!! consumer_display_name', consumer_display_name);
  return (
    <div>
      {consumer_number}
    </div>
    // <HStack>
    //   <Button>Click me</Button>
    //   <Button>Click me</Button>
    // </HStack>
  )
}
