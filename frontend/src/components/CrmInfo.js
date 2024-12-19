/* globals zoomSdk */
import { NavLink } from "react-router-dom";
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Form, Container, Button, Dropdown, Row, Col, Accordion, DropdownButton, Toast } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
// import { Button } from "@/components/ui/button"
// import { HStack } from "@chakra-ui/react"
import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import "./CrmInfo.css";

export const CrmInfo = forwardRef((props, ref) => {

  const {
    phoneNumber
  } = props.consumer;
  const zoomAccountId = props.zoomAccountId;

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

  const relatedToItems = [
    {label: 'Company', value: 'company'},
    {label: 'Deal', value: 'deal'}
  ];

  const [contact, setContact] = useState(null);
  const [isComponentRendeded, setIsComponentRendered] = useState(false);
  const [isRenderNewContactForm, setIsRenderNewContactForm] = useState(false);
  const [selectedPriorityItem, setSelectedPriorityItem] = useState(priorityItems[0]);
  const [selectedStatusItem, setSelectedStatusItem] = useState(statusItems[0]);

  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [ticketId, setTicketId] = useState('');

  const [searchTicketsTerm, setSearchTicketsTerm] = useState('');
  const [searchRelatedToTerm, setSearchRelatedToTerm] = useState('');
  
  const [relatedToRecords, setRelatedToRecords] = useState([]);
  const [selectedRelatedToRecord, setSelectedRelatedToRecord] = useState(null);
  const [relatedTickets, setRelatedTickets] = useState([]);
  const [allRelatedTickets, setAllRelatedTickets] = useState([]);

  const [activeRelatedTicketId, setActiveRelatedTicketId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastObject, setToastObject] = useState('{}');
  const [searchTicketsTimeout, setSearchTicketsTimeout] = useState(null);
  const [searchRelatedToTimeout, setSearchRelatedToTimeout] = useState(null);
  const [crmAccountInfo, setCrmAccountInfo] = useState({});

  const [selectedRelatedToItem, setSelectedRelatedToItem] = useState(relatedToItems[0]);
  const [contactFormData, setContactFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const handleChangeContactForm = (event) => {
    const { name, value } = event.target;
    setContactFormData({ ...contactFormData, [name]: value });
  };

  const createContact = async (event) => {
    event.preventDefault();
    const ticketBody = JSON.stringify(
      {
        zoomAccountId: zoomAccountId, 
        properties: {
          firstName: contactFormData.firstName,
          lastName: contactFormData.lastName,
          email: contactFormData.email,
          phone: phoneNumber
        }
      }
    );

    const createCrmContactResp = await (await fetch(
      '/api/zoomapp/createCrmContact',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: ticketBody
      })
    ).json();
    const contactObject = createCrmContactResp.data?.properties;
    setContact(contactObject);
    setToastObject({message: createCrmContactResp.message, type: createCrmContactResp.type});
    setShowToast(true);
    // Add your form submission logic here
  };

  const cancelContactForm = () => {
    setContactFormData(
      {
        firstName: '',
        lastName: '',
        email: ''
      }
    );
    setIsRenderNewContactForm(false);
  };
  
  const handleSelectRelatedTo = (eventKey) => {
    const selectedItem = relatedToItems.find(item => item.value === eventKey);
    setSelectedRelatedToItem(selectedItem);
    setSelectedRelatedToRecord(null);
    setSearchRelatedToTerm('');
    // Add your custom logic here
  };

  const handleToggle = (id) => {
    setActiveRelatedTicketId(activeRelatedTicketId === id ? null : id);
  };

  const saveTicket = async (event) => {
    const ticketBody = JSON.stringify(
      {
        zoomAccountId: zoomAccountId,
        relatedToEntity: selectedRelatedToItem.value,
        relatedToRecordId: selectedRelatedToRecord?.id,  
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
    setToastObject({message: createCrmTicketResp.message, type: createCrmTicketResp.type});
    setShowToast(true);
    setTicketId(createCrmTicketResp.data?.id);
  }

  const updateTicket = async (event) => {
    const currentTicket = relatedTickets.find(ticketItem => ticketItem.id === activeRelatedTicketId);
    const ticketBody = JSON.stringify(
      {
        zoomAccountId: zoomAccountId,
        properties: {
          ticketId: activeRelatedTicketId,
          subject: currentTicket.properties.subject, 
          description: currentTicket.properties.content,
          priority: currentTicket.properties.hs_ticket_priority,
          status: currentTicket.properties.hs_pipeline_stage
        }
      }
    );

    const updateCrmTicketResp = await (await fetch(
      '/api/zoomapp/updateCrmTicket',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: ticketBody
      })
    ).json();
    setToastObject({message: updateCrmTicketResp.message, type: updateCrmTicketResp.type});
    setShowToast(true);
    //setTicketId(createCrmTicketResp.id);
  }

  const selectRelatedToRecord = async (record) => {
    setSelectedRelatedToRecord(record);
    const recordName = record.properties.name ? record.properties.name : record.properties.dealname;
    setSearchRelatedToTerm(recordName);

  }
  const handleSearchRelatedToChange = async (event) => {
    setSelectedRelatedToRecord(null);
    const searchRelatedToTerm = event.target.value;
    setSearchRelatedToTerm(searchRelatedToTerm);
    window.clearTimeout(searchRelatedToTimeout);
    const searchTimeout = setTimeout(async () => {
      if (searchRelatedToTerm) {
        const entityName = selectedRelatedToItem.value;
        const getRelatedToBody = JSON.stringify(
          {
            zoomAccountId: zoomAccountId, 
            entity: entityName,
            searchTerm: searchRelatedToTerm
          }
        );
        const getCrmRelatedToResp = await (await fetch(
          '/api/zoomapp/searchRelatedToRecords',
          {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: getRelatedToBody
          })
        ).json();
        
    
        console.log('Related To RECORDS:', getCrmRelatedToResp.results);
        setRelatedToRecords(getCrmRelatedToResp.results);
        
      } else {
        setRelatedToRecords([]);
      }
    }, 600);
    setSearchRelatedToTimeout(searchTimeout);

  }

  const handleSearchTicketsChange = (event) => {
    const searchTicketsTerm = event.target.value;
    setSearchTicketsTerm(searchTicketsTerm);
    window.clearTimeout(searchTicketsTimeout);
    const searchTimeout = setTimeout(() => {
      if (searchTicketsTerm) {
        if (allRelatedTickets.length === 0) {
          setAllRelatedTickets(relatedTickets);
        }
        const relatedTicketsToSearch = [...allRelatedTickets];
        const relatedTicketsFiltered = relatedTicketsToSearch.filter((ticket) =>
          ticket.properties.subject.toLowerCase().includes(searchTicketsTerm.toLowerCase())
        );
        setRelatedTickets(relatedTicketsFiltered);
        
      } else {
        setRelatedTickets(allRelatedTickets);
      }
    }, 600);
    setSearchTicketsTimeout(searchTimeout);

  }

  const handleExistingTicketSubjectChange = (event) => {
    const currentTicketId = event.target.id; 
    const currentTicketSubject = event.target.value; 
    const selectedTicketObjIndex = relatedTickets.findIndex(ticketItem => ticketItem.id === currentTicketId);
    const updatedRelatedTickets = [...relatedTickets];
    updatedRelatedTickets[selectedTicketObjIndex].properties.subject = currentTicketSubject;
    setRelatedTickets(updatedRelatedTickets);
  };

  const handleExistingTicketContentChange = (event) => {
    const currentTicketId = event.target.id; 
    const currentTicketContent = event.target.value; 
    const selectedTicketObjIndex = relatedTickets.findIndex(ticketItem => ticketItem.id === currentTicketId);
    const updatedRelatedTickets = [...relatedTickets];
    updatedRelatedTickets[selectedTicketObjIndex].properties.content = currentTicketContent;
    setRelatedTickets(updatedRelatedTickets);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleExistingTicketPrioritySelect  = (eventKey, event) => {
    const currentTicketId = event.target.id; 
    const selectedPriorityItem = priorityItems.find(item => item.value === eventKey);
    const selectedTicketObjIndex = relatedTickets.findIndex(ticketItem => ticketItem.id === currentTicketId);
    const updatedRelatedTickets = [...relatedTickets];
    updatedRelatedTickets[selectedTicketObjIndex].properties.hs_ticket_priority_label = selectedPriorityItem.label;
    updatedRelatedTickets[selectedTicketObjIndex].properties.hs_ticket_priority = eventKey;
    setRelatedTickets(updatedRelatedTickets);
  };

  const handleExistingTicketStatusSelect  = (eventKey, event) => {
    const currentTicketId = event.target.id; 
    const selectedStatusItem = statusItems.find(item => item.value === eventKey);
    const selectedTicketObjIndex = relatedTickets.findIndex(ticketItem => ticketItem.id === currentTicketId);
    const updatedRelatedTickets = [...relatedTickets];
    updatedRelatedTickets[selectedTicketObjIndex].properties.hs_pipeline_stage_label = selectedStatusItem.label;
    updatedRelatedTickets[selectedTicketObjIndex].properties.hs_pipeline_stage = eventKey;
    setRelatedTickets(updatedRelatedTickets);
  };

  const handleTextChange = (event) => {
    setDescription(event.target.value);
  };

  const handleSubjectChange = (event) => {
    setSubject(event.target.value);
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

  const getCrmAccountInfo = async (zoomAccountId) => {
    const getContactByPhoneBody = JSON.stringify({zoomAccountId: zoomAccountId, phoneNumber: phoneNumber});
    const accountInfoResponse = await (await fetch(`/api/zoomapp/getCrmAccountInfo?zoomAccountId=${zoomAccountId}`)).json();
    console.log('!!! accountInfoResponse:', accountInfoResponse);
    setCrmAccountInfo(accountInfoResponse);
  }

  
  const showNewRecordForm = () => {
    setIsRenderNewContactForm(true);
  }
  const getCrmContactByPhone = async (zoomAccountId, phoneNumber) => {
    const getContactByPhoneBody = JSON.stringify({zoomAccountId: zoomAccountId, phoneNumber: phoneNumber});
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
    console.log(getCrmContactByPhoneResp);

    let contactObject;
    if (getCrmContactByPhoneResp.results.length > 0) {
      contactObject = getCrmContactByPhoneResp.results[0]?.properties;
    } else {
      contactObject = {
        firstname: 'Unknown',
        lastname: 'Contact',
        email: ''
      }
    }
    setContact(contactObject);
    setIsComponentRendered(true);
    return new Promise((resolve, reject) => {
      resolve(contactObject);
    });
    
  }

  const getCrmRelatedTickets = async (zoomAccountId, contactProperties) => {
    const getRelatedTicketsBody = JSON.stringify(
      {
        zoomAccountId: zoomAccountId, 
        properties: {
          contactId: contactProperties.hs_object_id
        }
      }
    );
    const getCrmRelatedTicketsResp = await (await fetch(
      '/api/zoomapp/getCrmTickets',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: getRelatedTicketsBody
      })
    ).json();
    const relatedTickets = getCrmRelatedTicketsResp.results.map(ticketItem => {
      const stageItem = statusItems.find(item => item.value === ticketItem.properties.hs_pipeline_stage);
      const priorityItem = priorityItems.find(item => item.value === ticketItem.properties.hs_ticket_priority);
      const [ticketDate, ticketTime] = ticketItem.updatedAt.split('T');
      ticketItem.ticketDate = ticketDate;
      ticketItem.properties = {
        ...ticketItem.properties, 
        hs_pipeline_stage_label: stageItem.label, 
        hs_ticket_priority_label: priorityItem.label
      }
      return ticketItem;
    });

    console.log('Related tickets:', relatedTickets);
    setRelatedTickets(relatedTickets);
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

  const openContactPage = (event) => {
    zoomSdk.openUrl({
      url: `https://app.hubspot.com/contacts/${crmAccountInfo.portalId}/contact/${contact.hs_object_id}`
    });
  };
  
  if(!isComponentRendeded) {
    getCrmAccountInfo(zoomAccountId);
    getCrmContactByPhone(zoomAccountId, phoneNumber).then(contactProperties => {
      getCrmRelatedTickets(zoomAccountId, contactProperties);
    })
    .catch(error => {
        // Handle/report error
    });
  }

  if (contact) {
    return (
      <>
        <Toast 
          bg={toastObject.type} 
          onClose={() => setShowToast(false)} 
          show={showToast} 
          delay={3000} autohide
          style={{width: '100%'}}
        >
        <Toast.Header>
            <strong className='me-auto'>{toastObject.message}</strong>
          </Toast.Header>
          <Toast.Body className='text-white'>{toastObject.message}</Toast.Body>
        </Toast>

        <Card style={{ width: '100%' }}>
        <Card.Body>
          <Card.Title>
            {contact.firstname} {contact.lastname}
            {
              contact.hs_object_id ? (
                <Button variant="primary" onClick={openContactPage} style={{float: 'right'}}>
                  Open in CRM
                </Button>
              ) : (
                <Button variant="primary" onClick={showNewRecordForm} style={{float: 'right'}}>
                  Create Contact
                </Button>
              )
            }
            
          </Card.Title>
          <Card.Text>
              <p>Email: {contact.email}</p> 
              <p>Phone Number: {phoneNumber}</p> 
          </Card.Text>
        </Card.Body>
      </Card>
      { contact.hs_object_id ? (
        <Tabs
          defaultActiveKey="newTicket"
          id="uncontrolled-tab-example"
          className="mb-3 tab-custom"
        >
        <Tab eventKey="newTicket" title="New Ticket">
          <Accordion defaultActiveKey="1">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Associations</Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col>
                    <Dropdown onSelect={handleSelectRelatedTo}>
                      <Dropdown.Toggle variant="light" id="dropdown-basic">
                        Related To: {selectedRelatedToItem.label}
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        {
                          relatedToItems.map((item, index) => (
                            <Dropdown.Item key={index} eventKey={item.value}>
                              {item.label}
                            </Dropdown.Item>
                          ))
                        }
                      </Dropdown.Menu>
                      </Dropdown>
                  </Col>
                  <Col>
                    <div className="search-dropdown" style={{ width: "300px" }}>
                      <Form.Control
                        type="text"
                        placeholder="Search..."
                        value={searchRelatedToTerm}
                        onChange={handleSearchRelatedToChange}
                      />
                      {relatedToRecords.length > 0 && !selectedRelatedToRecord && (<Dropdown.Menu show>
                        {relatedToRecords.map((record, index) => (
                          <Dropdown.Item key={index} onClick={() => selectRelatedToRecord(record)}>
                            {record.properties.name ? record.properties.name : record.properties.dealname}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                      )}  
                    </div>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>Properties</Accordion.Header>
              <Accordion.Body>
                <Container>
                  <Row>
                    <Col>
                      <div className="m-1">
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
                      <div className="m-1">
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
                        placeholder="Subject"
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
                        placeholder="Description"
                      />
                    </Form.Group>
                  </Form>
                </Container>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
          <Container className="mt-2">
            <Button 
              variant="primary" 
              onClick={saveTicket}
              style={{ float: "right"}}>
                Save Ticket
            </Button>
          </Container>
        </Tab>
        <Tab eventKey="profile" title="Existing Tickets">
          <div style={{ width: "400px", margin: "2rem auto" }}>
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchTicketsTerm}
              onChange={handleSearchTicketsChange}
            /> 
          </div>
          <div className="accordion-list tickets-items">
            <Accordion>
              {relatedTickets.map((ticket) => (
                <Card key={ticket.id} style={{"border-color": "#0d6efd", "margin-bottom": "0.5rem"}}>
                  <Card.Header>
                    <Button
                      variant="link"
                      onClick={() => handleToggle(ticket.id)}
                      aria-expanded={activeRelatedTicketId === ticket.id}
                      style={{ textDecoration: "none", width:"100%" }}
                    >
                      <Row>
                        <Col xs={9} style={{ "text-align":"start", "color": "black" }}>
                            {ticket.properties.subject}
                        </Col>
                        <Col xs={3} style={{ "color": "black" }}>
                          {ticket.ticketDate}
                        </Col>
                      </Row>
                    </Button>
                  </Card.Header>
                  <Accordion.Collapse eventKey={String(ticket.id)} in={activeRelatedTicketId === ticket.id}>
                    <Card.Body>
                      <Container>
                        <Row>
                          <Col>
                            <div className="m-1">
                              <Dropdown onSelect={handleExistingTicketPrioritySelect}>
                                <Dropdown.Toggle variant="light" id="dropdown-basic">
                                  Priority: {ticket.properties.hs_ticket_priority_label}
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                  {
                                    priorityItems.map((item, index) => (
                                      <Dropdown.Item key={index} eventKey={item.value} id={ticket.id}>
                                        {item.label}
                                      </Dropdown.Item>
                                    ))
                                  }
                                </Dropdown.Menu>
                              </Dropdown>
                            </div>
                          </Col>
                          <Col>
                            <div className="m-1">
                              <Dropdown onSelect={handleExistingTicketStatusSelect}>
                                <Dropdown.Toggle variant="light" id="dropdown-basic-status">
                                  Status: {ticket.properties.hs_pipeline_stage_label}
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                  {
                                    statusItems.map((item, index) => (
                                      <Dropdown.Item key={index} eventKey={item.value} id={ticket.id}>
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
                              id={ticket.id}
                              value={ticket.properties.subject}
                              onChange={handleExistingTicketSubjectChange}
                              placeholder="Subject"
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
                              id={ticket.id}
                              value={ticket.properties.content}
                              onChange={handleExistingTicketContentChange}
                              placeholder="Description"
                            />
                          </Form.Group>
                        </Form>
                      </Container>
                      <Container className="mt-2">
                        <Button variant="primary" onClick={updateTicket} style={{float: "right"}}>Update Ticket</Button>
                      </Container>
                    </Card.Body>
                  </Accordion.Collapse>
                </Card>
              ))}
            </Accordion>
          </div>
        </Tab>
      </Tabs>
      ) : <>
          { !isRenderNewContactForm ? (
              <Toast
                className="d-inline-block m-1"
                style={{width: '100%'}}
                bg="info"
              >
                <Toast.Header>
                  <strong className="me-auto">
                    You can not create ticket.
                  </strong>
                </Toast.Header>
                <Toast.Body className={'text-white'}>
                  Please, assign engagement to existing contact or create new one.
                </Toast.Body>
              </Toast>
            ) : (
              <Card className="mt-1" style={{ width: '100%' }}>
                <Card.Body>
                  <Container>
                    <Form onSubmit={createContact}>
                      <Form.Group className="mb-2" controlId="newContactForm.FirstName">
                        <Form.Label>First name</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="firstName"
                          value={contactFormData.firstName}
                          onChange={handleChangeContactForm}
                        />
                      </Form.Group>
                      <Form.Group className="mb-2" controlId="newContactForm.LastName">
                        <Form.Label>Last name</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="lastName"
                          value={contactFormData.lastName}
                          onChange={handleChangeContactForm}
                        />
                      </Form.Group>
                      <Form.Group className="mb-2" controlId="newContactForm.Email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control 
                          type="email" 
                          name="email"
                          value={contactFormData.email}
                          onChange={handleChangeContactForm}
                          />
                      </Form.Group>
                      <Row className="mt-4">
                        <Col>
                          <Button variant="primary" type="submit" className="w-100">
                            Create Contact
                          </Button>
                        </Col>
                        <Col>
                          <Button
                            variant="light"
                            type="button"
                            className="w-100"
                            onClick={cancelContactForm}
                          >
                            Cancel
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Container>
                </Card.Body>
              </Card>
            )
          }
        </>
      }
      
      </>
    )
  } 
  
})
