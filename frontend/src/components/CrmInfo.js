import { NavLink } from "react-router-dom";
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Form, Container, Button, Dropdown, Row, Col, Accordion, DropdownButton } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
// import { Button } from "@/components/ui/button"
// import { HStack } from "@chakra-ui/react"
import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import "./CrmInfo.css";

export const CrmInfo = forwardRef((props, ref) => {
  const statusItems = [
    {label: 'New', value: '1'},
    {label: 'Waiting on contact', value: '2'},
    {label: 'Waiting on us', value: '3'},
    {label: 'Closed', value: '4'}
  ];

  const priorityItems = [
    {label: 'Low', value: 'LOW'},
    {label: 'Medium', value: 'MEDIUM'},
    {label: 'High', value: 'HIGH'}
  ];

  const [contact, setContact] = useState(null);
  const [isComponentRendeded, setIsComponentRendered] = useState(false);
  const [selectedPriorityItem, setSelectedPriorityItem] = useState(priorityItems[0]);
  const [selectedStatusItem, setSelectedStatusItem] = useState(statusItems[0]);

  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [ticketId, setTicketId] = useState('');

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  const items = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"];


  const saveTicket = async (event) => {
    const ticketBody = JSON.stringify(
      {
        zoomAccountId: zoomAccountId,
        properties: {
          contactId: contact.hs_object_id,
          subject: subject, 
          description: description,
          priority: selectedPriorityItem.value,
          status: selectedStatusItem.value
        }
      }
    );

    const createCrmTicketResp = await (await fetch(
      '/api/zoomapp/createCrmTicket',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: ticketBody
      })
    ).json();
    setTicketId(createCrmTicketResp.id);
  }

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term) {
      const filtered = items.filter((item) =>
        item.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  };

  const handleTextChange = (event) => {
    setDescription(event.target.value);
  };

  const handleSubjectChange = (event) => {
    setSubject(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleSelectPriority = (eventKey) => {
    const selectedItem = priorityItems.find(item => item.value === eventKey);
    setSelectedPriorityItem(selectedItem);
    // Add your custom logic here
  };

  const handleSelectStatus = (eventKey) => {
    console.log(statusItems);
    const selectedItem = statusItems.find(item => item.value === eventKey);
    setSelectedStatusItem(selectedItem);
    // Add your custom logic here
  };

  const getCrmContactByPhone = async (zoomAccountId, phoneNumber) => {
    const getContactByPhoneBody = JSON.stringify({zoomAccountId: zoomAccountId, phoneNumber: phoneNumber});
    console.log('!!!! getContactByPhoneBody:', getContactByPhoneBody);
    const getCrmContactByPhoneResp = await (await fetch(
      '/api/zoomapp/getCrmContactByPhone',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: getContactByPhoneBody
      })
    ).json();
    console.log('! getCrmContactByPhoneResp:', getCrmContactByPhoneResp.results[0]?.properties);
    setContact(getCrmContactByPhoneResp.results[0]?.properties);
    setIsComponentRendered(true);
  }

  useImperativeHandle(ref, () => ({
    async createNotes(zoomAccountId, engagementId) {
      const createNotesBody = JSON.stringify(
        {
          zoomAccountId: zoomAccountId,
          engagementId: engagementId,
          crmTicketId: ticketId
        }
      );
      const createNotesResp = await (await fetch(
        '/api/zoomapp/saveEngagementNotes',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: createNotesBody
        })
      ).json();
      console.log('! createNotesResp:', createNotesResp);
    }
  }))
  

  const {
    phoneNumber
  } = props.consumer;
  const zoomAccountId = props.zoomAccountId;
  if(!isComponentRendeded) {
    getCrmContactByPhone(zoomAccountId, phoneNumber);
  }

  if (contact) {
    return (
      <>
        <Card style={{ width: '18rem' }}>
        <Card.Body>
          <Card.Title>{contact.firstname} {contact.lastname}</Card.Title>
          <Card.Text>
              <p>Email: {contact.email}</p> 
              <p>Phone Number: {phoneNumber}</p> 
          </Card.Text>
        </Card.Body>
      </Card>
      
      <Tabs
        defaultActiveKey="newTicket"
        id="uncontrolled-tab-example"
        className="mb-3 tab-custom"
      >
        <Tab eventKey="newTicket" title="New Ticket">
          <Accordion defaultActiveKey="1">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Ticket Associations</Accordion.Header>
              <Accordion.Body>
              <div className="search-dropdown" style={{ width: "400px", margin: "20px auto" }}>
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {filteredItems.length > 0 && (<Dropdown.Menu show>
                  {filteredItems.map((item, index) => (
                    <Dropdown.Item key={index} onClick={() => setSearchTerm(item)}>
                      {item}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
                )}  
              </div>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>Ticket Properties</Accordion.Header>
              <Accordion.Body>
                <Container>
                  <Row>
                    <Col>
                      <div className="m-3">
                        <Dropdown onSelect={handleSelectPriority}>
                          <Dropdown.Toggle variant="light" id="dropdown-basic">
                            Priority: {selectedPriorityItem.label}
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            {
                              priorityItems.map((item, index) => (
                                <Dropdown.Item key={index} eventKey={item.value}>
                                  {item.label}
                                </Dropdown.Item>
                              ))
                            }
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </Col>
                    <Col>
                      <div className="m-3">
                        <Dropdown onSelect={handleSelectStatus}>
                          <Dropdown.Toggle variant="light" id="dropdown-basic-status">
                            Status: {selectedStatusItem.label}
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            {
                              statusItems.map((item, index) => (
                                <Dropdown.Item key={index} eventKey={item.value}>
                                  {item.label}
                                </Dropdown.Item>
                              ))
                            }
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </Col>
                  </Row>
                </Container>
                <Container className="mt-3">
                  <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="exampleText">
                      <Form.Label>Subject</Form.Label>
                      <Form.Control
                        type="text"
                        value={subject}
                        onChange={handleSubjectChange}
                        placeholder="Ticket subject"
                      />
                    </Form.Group>
                  </Form>
                </Container>
                <Container className="mt-3">
                  <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="exampleTextarea">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={description}
                        onChange={handleTextChange}
                        placeholder="Ticket description"
                      />
                    </Form.Group>
                  </Form>
                </Container>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
          <Container className="mt-2">
            <Button variant="primary" onClick={saveTicket}>Save Ticket</Button>
          </Container>
        </Tab>
        <Tab eventKey="profile" title="Existing Tickets">
          Tab content for Profile
        </Tab>
      </Tabs>
      </>
      
      
    )
  } 
  
})
